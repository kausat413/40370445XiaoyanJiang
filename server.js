// const express = require('express');


// const mysql = require('mysql');
// const bodyParser = require('body-parser');
// const http = require('http');
// api组件
// const fetch = require('node-fetch');
// const fetch = require('node-fetch').default;


import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import http from 'http'
import fetch from 'node-fetch';
import path from 'path';


import { fileURLToPath } from 'url';
import { dirname } from 'path';




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 3001;


// 指定存放静态文件的目录为public
app.use(express.static('html')); 
app.use(express.static('views')); 
// 解析JSON请求体
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

// 设置模板路径
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tradecard'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
});

// 注册用户
app.post('/register', (req, res) => {
    const { username, password , email} = req.body;
    
    const newUser = { username, password, email };
    
    db.query('INSERT INTO users SET ?', newUser, (err, result) => {
        if (err) {
            res.status(500).send('Error registering user');
        } else {
            res.json({ message: '注册成功', redirectTo: '/login'});
        }
    });
});

// 全局变量:存储当前用户名
let loggedInUsername = '';


// 用户登录
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, result) => {
        if (err) {
            res.status(500).send('Error logging in');
        } else {
            if (result.length > 0) {
                // 登录成功，返回当前用户名
                loggedInUsername = username;
                console.log('登录成功!')
                res.json({ redirectTo: '/cards'});
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        }
    });
});


// app.get('/cards', (req, res) => {
//     console.log('搜索页面');
//     // 重定向到搜索页面
//     const  username = loggedInUsername;

//     res.render('cards.ejs',{ user: username });
// });



// 登录地址
app.get('/login', (req, res) => {
    console.log('login页面');
    // 重定向到搜索页面
    res.render('login.ejs');
});
//注册地址
app.get('/register', (req, res) => {
    console.log('register页面');
    // 重定向到搜索页面
    res.render('register.ejs');
});



// 处理退出登录请求
app.get('/logout', (req, res) => {
    // 清除全局变量值
    loggedInUsername = ''
    console.log('用户退出'+loggedInUsername);
    // 重定向到登录页面
    res.render('login.ejs');
});



//searchs地址
app.get('/searchs', (req, res) => {
    console.log('searchs页面');
    // 重定向到搜索页面
    const  username = loggedInUsername;
    const cards = searchs_all_list;
    console.log("searchs");
    res.render('searchs.ejs',{ user: username, search_cards: cards});
});

// list地址
app.get('/list', (req, res) => {
    console.log('list页面');
    // 重定向到搜索页面
    const  username = loggedInUsername;
    const cards = searchs_all_list;
    // console.log("全局变量"+cards);
    res.render('list.ejs',{ user: username, search_cards: cards});
});

// 搜索全局变量
let searchs_all_list = ''


// 获取交易卡数据,通过调用api获取数据库值,返回到模板
app.get('/cards', async (req, res) => {
    try {
        const response = await fetch(`http://127.0.0.1:4000/CardsAPI`);
        const cards = await response.json();

        // console.log(cards);
        searchs_all_list = cards;
        
        const  username = loggedInUsername;
        res.render('cards.ejs', { all_cards: cards, user: username });
    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('获取或存储卡片数据时出错');
    }
});




// 请求所有卡牌   最初用法
// app.get('/cards', async (req, res) => {
//     try {
//         // 查询数据库中的所有卡片数据
//         const query = 'SELECT * FROM cards';
//         // console.log(query);
//         db.query(query, (err, results) => {
//             if (err) {
//                 console.error('Error fetching cards from database:', err);
//                 res.status(500).send('获取卡片数据时出错');
//             } else {
//                 // 将查询结果传递到 EJS 模板中进行渲染
//                 const username = loggedInUsername; // 获取当前登录用户
//                 // console.log(results);
                
//                 res.render('cards', { all_cards: results, user: username });
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching cards:', error);
//         res.status(500).send('获取卡片数据时出错');
//     }
// });








// 添加卡牌到收藏表的路由处理
app.post('/add-to-collection', (req, res) => {
    const { cardName } = req.body;
    // console.log(cardName);
    // 检查是否已登录
    if (!loggedInUsername) {
        res.status(401).send('Unauthorized: User not logged in');
        return;
    }

    // 查询卡牌信息
    const query = 'SELECT * FROM cards WHERE name = ?';
    db.query(query, [cardName], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length > 0) {
            const user = loggedInUsername;
            const card = results[0];

            // 检查当前用户是否已经拥有该卡牌
            const checkQuery = 'SELECT * FROM collections WHERE u_name = ? AND name = ?';
            db.query(checkQuery, [user, cardName], (checkError, checkResults) => {
                if (checkError) {
                    console.error('Error checking duplicate card:', checkError);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                if (checkResults.length > 0) {
                    console.log(`Card ${cardName} already exists in collection for user ${user}`);
                    res.status(400).send('You already have this card in your collection');
                } else {
                    // 将卡牌信息添加到集合
                    const insertQuery = 'INSERT INTO collections (id, name, url_img, set_name, hp, rarity, stage, attacks, u_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                    db.query(insertQuery, [card.id, card.name, card.url_img, card.set_name, card.hp, card.rarity, card.stage, card.attacks, user], (err, result) => {
                        if (err) {
                            console.error('Error adding card to collection:', err);
                            res.status(500).send('Internal Server Error');
                            return;
                        }
                        console.log(`Added ${card.name} to collections for user ${user}`);
                        res.sendStatus(200);
                    });
                }
            });
        } else {
            res.status(404).send('Card not found');
        }
    });
});

// 点赞功能
app.post('/givealiecard', (req, res) => {
    const { cardName } = req.body; 
    // 当前用户登录名
    const username = loggedInUsername;
    console.log(cardName, username);

    // 检查用户是否登录
    if (username) {
        // 查询当前点赞的卡牌
        const query = `SELECT * FROM cards WHERE name = '${cardName}'`;
        db.query(query, [cardName], (error, results) => {
            if (error) {
                console.error('Error querying database:', error);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (results.length > 0) {
                const card = results[0];

                // 检查用户是否点赞过该卡片
                const checkLikeQuery = `SELECT * FROM likes WHERE user_id = '${username}' AND name = '${cardName}'`;
                db.query(checkLikeQuery, (checkError, checkResults) => {
                    if (checkError) {
                        console.error('Error querying database:', checkError);
                        res.status(500).send('check for errors');
                        return;
                    }

                    if (checkResults.length === 0) {
                        console.log('1'+checkResults.lengt);
                        // 给点赞数字段加1
                        const updateQuery = `UPDATE cards SET likes = likes + 1 WHERE name = '${cardName}'`;
                        db.query(updateQuery, (updateError, updateResults) => {
                            if (updateError) {
                                console.error('Error updating database:', updateError);
                                res.status(500).send('Internal Server Error');
                                return;
                            }

                            // 记录用户的点赞行为到likes表
                            const insertQuery = `INSERT INTO likes (user_id, name) VALUES ('${username}', '${cardName}')`;
                            db.query(insertQuery, (insertError, insertResults) => {
                                if (insertError) {
                                    console.error('Error inserting into database:', insertError);
                                    res.status(500).send('Internal Server Error');
                                    return;
                                }
                                console.log('Record success')
                                res.status(200).send('Liked successfully');
                            });
                        });
                    } else {
                        console.log('The user has liked the card');
                        res.status(500).send('Already liked the card');
                    }
                });
            } else {
                res.status(404).send('Card not found');
            }
        });
    } else {
        // 未登录用户，直接将点赞数字段加1
        const updateQuery = `UPDATE cards SET likes = likes + 1 WHERE name = '${cardName}'`;
        db.query(updateQuery, (updateError, updateResults) => {
            if (updateError) {
                console.error('Error updating database:', updateError);
                res.status(500).send('Internal Server Error');
                return;
            }
            console.log('记录成功')
            res.status(200).send('Liked successfully');
        });
    }
});


// 搜索功能
// 处理 /searchsvalue 路由的 POST 请求
app.post('/searchsvalue', async (req, res) => {
    try {
        const { searchInput, rarityFilter } = req.body; // 从请求体中获取 searchInput

        console.log("获取到前端搜索值");

        const encodedSearchInput = encodeURIComponent(searchInput);
        const encodedRarityFilter = encodeURIComponent(rarityFilter);

        const response = await fetch(`http://127.0.0.1:4000/searchsAPI?cardName=${encodedSearchInput}&rarityFilter=${encodedRarityFilter}`);
        const cards = await response.json();

        //   console.log("api返回值:"+cards);
        const username = loggedInUsername;
        searchs_all_list = cards;
        console.log('成功搜索！');
        res.render('searchs', { search_cards: searchs_all_list, user: username });

    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('搜索卡片数据时出错');
    }
});
  
//个人地址
app.get('/profile', async (req, res) => {
    try {
        const cardName = loggedInUsername;
        // Anti -SQL injection risk 
        // Request calculation three total number
        const totalResponse = await fetch(`http://127.0.0.1:4000/number1?cardName=${encodeURIComponent(cardName)}`);
        const total = await totalResponse.json();

        // Request collection data
        const collectResponse = await fetch(`http://127.0.0.1:4000/collect_total?cardName=${encodeURIComponent(cardName)}`);
        const collect_total = await collectResponse.json();

        // Request like data
        const likesResponse = await fetch(`http://127.0.0.1:4000/likes_total?cardName=${encodeURIComponent(cardName)}`);
        const likes_total = await likesResponse.json();

        const username = cardName;
        res.render('profile.ejs', { user: username, total_cards: total, collect_cards: collect_total, likes_cards: likes_total });
    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('Request errors');
    }
});

// 删除个人收藏事件
app.post('/deleteCard', async (req, res) => {
    try{
        const {cardId } = req.body; 
        console.log(cardId);
        // 模拟用户
        const username = loggedInUsername;
        // Anti -SQL injection risk
        const url = new URL(`http://127.0.0.1:4000/deleteAPI`);
        url.searchParams.append('username', username);
        url.searchParams.append('Name', cardId);
        const response = await fetch(url.href);

        res.status(200).send('Delect collect successfully');
    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('请求错误');
      }
});

// 删除个人喜欢事件
app.post('/deleteLikeCard', async (req, res) => {
    try {
        const { cardName } = req.body;
        console.log(cardName);
        // 请求删除
        const username = loggedInUsername;
        // Anti -SQL injection risk
        const url = new URL(`http://127.0.0.1:4000/deleteLikeAPI`);
        url.searchParams.append('username', username);
        url.searchParams.append('cardName', cardName);

        const response = await fetch(url.href);

        res.status(200).send('Delete Like successfully');
    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('请求错误');
    }
});



// 启动服务器
http.createServer(app).listen(port, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${port}/cards`);
});
