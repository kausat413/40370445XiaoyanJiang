import express from 'express';
import mysql from 'mysql';
import fetch from 'node-fetch';
import http from 'http'



const app = express();
const port = 4000;

// 创建数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tradecard'
});
// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database connected');
});

// 获取交易卡数据 官方API  
app.get('/api-cards', async (req, res) => {
    try {

        // swsh1 cards
        for (let i = 1; i <= 136; i++) {
            const response = await fetch(`https://api.tcgdex.net/v2/en/sets/swsh1/${i}`);
            const cards = await response.json();
            
            // 判断attacks是否为空
            const secondAttackEffect = 
            cards.attacks[1]?.effect !== undefined ? cards.attacks[1].effect :
            cards.attacks[0]?.effect !== undefined ? cards.attacks[0].effect :
            'N/A';
            console.log('series:', cards.set.id);
            console.log('secondAttackEffect:', secondAttackEffect);

            const query = `
                INSERT INTO cards (id, name, series, url_img, set_name, hp, rarity, stage, attacks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [cards.id, cards.name, cards.set.id, cards.image, cards.set.name, cards.hp, cards.rarity, cards.stage, secondAttackEffect];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data into database:', err);
                } else {
                    console.log('Data inserted successfully');
                }
            });
        }

        
        for (let i = 1; i <= 136; i++) {
            const response = await fetch(`https://api.tcgdex.net/v2/en/sets/base1/${i}`);
            const cards = await response.json();
            
            // 判断attacks是否为空
            const secondAttackEffect = 
            cards.attacks[1]?.effect !== undefined ? cards.attacks[1].effect :
            cards.attacks[0]?.effect !== undefined ? cards.attacks[0].effect :
            'N/A';
            console.log('series:', cards.set.id);
            console.log('secondAttackEffect:', secondAttackEffect);

            const query = `
                INSERT INTO cards (id, name, series, url_img, set_name, hp, rarity, stage, attacks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [cards.id, cards.name, cards.set.id, cards.image, cards.set.name, cards.hp, cards.rarity, cards.stage, secondAttackEffect];

            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data into database:', err);
                } else {
                    console.log('Data inserted successfully');
                }
            });
        }

        res.status(200).send('所有卡片数据插入成功');
    } catch (error) {
        console.error('Error fetching or inserting cards:', error);
        res.status(500).send('获取或存储卡片数据时出错');
    }
});




// 获取交易卡数据  
// app.get('/ce', async (req, res) => {
//     try {
//             const response = await fetch(`https://api.tcgdex.net/v2/en/sets/base1/1`);
//             const cards = await response.json();

//             console.log(cards);
        
//         res.status(200).send('所有卡片数据插入成功');
//     } catch (error) {
//         console.error('Error fetching or inserting cards:', error);
//         res.status(500).send('获取或存储卡片数据时出错');
//     }
// });



// const router = express.Router();

// 获取交易卡数据
app.get('/CardsAPI', async (req, res) => {
    try {
        // 查询数据库中的所有卡片数据
        const query = "SELECT * FROM cards";
        db.query(query, (err, results) => {
            if (err) {
                console.log("语句错误")
                console.error('Error fetching cards from database:', err);
                res.status(500).send('从数据库获取卡片数据时出错');
            } else {

                console.log("进入到返回数据接口");
                // 将查询结果发送给 server.js
                // console.log(results);
                res.json(results); 
            }
         });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('获取卡片数据时出错');
    }
});



import bodyParser from 'body-parser';
// 使用 body-parser 中间件来解析请求体数据
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 搜索功能
app.get('/searchsAPI', (req, res) => {
    try {
        const searchInput = req.query.cardName;
        const rarityFilter = req.query.rarityFilter;
        console.log(searchInput,rarityFilter);
        // 查询数据库中的所有卡片数据
        let query = '';
        if (searchInput && rarityFilter) {
            // 如果同时存在搜索关键字和稀有度筛选器值，则根据两者都进行筛选
            query = `SELECT * FROM cards WHERE (name = "${searchInput}" OR rarity = "${searchInput}" OR id = "${searchInput}") AND rarity = "${rarityFilter}"`;
        } else if (rarityFilter) {
            // 如果只有稀有度筛选器值，则只按照稀有度进行筛选
            query = `SELECT * FROM cards WHERE rarity = "${rarityFilter}"`;
        } else {
            // 如果两者都不存在，则查询所有卡片
            query = 'SELECT * FROM cards';
        }

        db.query(query,(err, results) => {
            if (err) {
                console.log(query);
                console.log("语句错误")
                console.error('Error fetching cards from database:', err);
                res.status(500).send('从数据库获取卡片数据时出错');
            } else {
                console.log("测试进入到返回数据接口");
                // 将查询结果发送给 server.js
                // console.log(results);
                res.json(results); 
            }
        });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send('获取卡片数据时出错');
    }
});

// profile number1
app.get('/number1', async (req, res) => {
    try {
        const profile = req.query.cardName;
        console.log(profile);
        // 查询当前用户的收藏数量
        const query = `
        SELECT COUNT(*) as count1 FROM collections 
        WHERE u_name = '${profile}'`;
        // 查询当前用户喜欢的数量
        const query1 = `
        SELECT COUNT(*) as count2 FROM likes
        WHERE user_id = '${profile}'
        `;
        // 查询当前用户收藏最多的系列
        const query2 = `
        SELECT COUNT(rarity) as rarity_count
        FROM collections
        WHERE u_name = '${profile}'
        GROUP BY rarity
        ORDER BY rarity_count DESC
        LIMIT 1
        `;

        // 查询当前用户收藏罕见系列
        const query3 = `
        SELECT COUNT(rarity) as Favorite_count
        FROM collections
        WHERE rarity = 'Common' AND u_name = '${profile}';
        `;

        let response = {};

        // 查询收藏数量
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching collection count:', err);
                res.status(500).send('Error while getting collection count from database');
            } else {
                response.count1 = results.length > 0 ? results[0].count1 : 0;
                
                console.log(JSON.stringify(response));
                // 查询喜欢数量
                db.query(query1, (err, results1) => {
                    if (err) {
                        console.error('Error fetching like count:', err);
                        res.status(500).send('Error while getting like count from database');
                    } else {
                        response.count2 = results1.length > 0 ? results1[0].count2 : 0;
                        console.log(JSON.stringify(response));
                        // 查询最常收藏系列
                        db.query(query2, (err, results2) => {
                            if (err) {
                                console.error('Error fetching most collected series:', err);
                                res.status(500).send('Error while getting most collected series from database');
                            } else {
                                response.rarity_count = results2.length > 0 ? results2[0].rarity_count : 0;
                                console.log(JSON.stringify(response));
                                db.query(query3, (err, results3) => {
                                    if (err) {
                                        console.error('Error fetching most collected series:', err);
                                        res.status(500).send('Error while getting most collected series from database');
                                    } else {
                                        response.Favorite_count = results3.length > 0 ? results3[0].Favorite_count : 0;
                                        console.log(JSON.stringify(response));
                                        res.json(response); // 将所有结果发送给客户端
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error while fetching data');
    }
});

// personal collection data
app.get('/collect_total', (req, res) => {
    try {
        const profile = req.query.cardName;
        console.log(profile);
        // 查询当前用户的收藏数量
        const query = `SELECT * FROM collections WHERE u_name = '${profile}'`;

        db.query(query,(err, results) =>{
            if (err) {
                console.error('Error fetching most collected series:', err);
                res.status(500).send('Error while getting most collected series from database');
            } else {
                    res.json(results); // 将所有结果发送给客户端
            }
        });
    } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Error while fetching data');
    }
});
// personal likes data
app.get('/likes_total', (req, res) => {
    try {
        const profile = req.query.cardName;
        console.log(profile);
        // 查询当前用户的喜欢数量
        const query = `SELECT *
        FROM likes
        INNER JOIN cards ON likes.name = cards.name
        WHERE likes.user_id = '${profile}';`;

        db.query(query,(err, results) =>{
            if (err) {
                console.error('Error fetching most collected series:', err);
                res.status(500).send('Error while getting most collected series from database');
            } else {
                    // console.log(results);
                    res.json(results); // 将所有结果发送给客户端
            }
        });
    } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Error while fetching data');
    }
});



// 删除collect事件
app.get('/deleteAPI', (req, res) => {
    try {
        // 用户名
        const username = req.query.username;
        // 卡牌名
        const name = req.query.Name;

        console.log(username,name);
        // 查询当前用户的收藏数量
        const query = `DELETE FROM collections WHERE u_name = '${username}' AND name = '${name}';`;
        console.log(query);
        db.query(query,(err, results) =>{
            if (err) {
                console.error('Error fetching most collected series:', err);
                res.status(500).send('Error while getting most collected series from database');
            } else {
                    console.log(results);
                    res.json(results); // 将所有结果发送给客户端
            }
        });
    } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Error while fetching data');
    }
});

// 删除like事件
app.get('/deleteLikeAPI', (req, res) => {
    try {
        const username = req.query.username;
        const cardName = req.query.cardName;
        console.log(username,cardName);
        // 删除当前用户的喜欢卡牌
        const query = `
        DELETE likes
        FROM likes
        INNER JOIN cards ON likes.name = cards.name
        WHERE likes.user_id = '${username}' AND likes.name = '${cardName}';
        `;
        
        // 喜欢数减一
        const query1 = `
        UPDATE cards
        SET likes = likes - 1
        WHERE name = '${cardName}';
        `;
        console.log(query1);

        db.query(query,(err, results) =>{
            if (err) {
                console.error('Error fetching most collected series:', err);
                res.status(500).send('Error while getting most collected series from database');
            } else {
                db.query(query1,(err, results1) =>{
                    if (err) {
                        console.error('Error fetching most collected series:', err);
                        res.status(500).send('Error while getting most collected series from database');
                    } else {
                            // console.log(results);
                            res.json(results); // 将结果发送给客户端
                    }
                });
                    
            }
        });
    } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Error while fetching data');
    }
});



// 启动应用程序接口服务器
http.createServer(app).listen(port, '127.0.0.1', () => {
    console.log(`API Server running on http://127.0.0.1:${port}/api-cards`);
});
