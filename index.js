const redis = require('redis');
var express = require('express');
var cors = require('cors');
var axios = require('axios');
const http = require("http");
var app = express();
app.use(cors())

var client = redis.createClient({
    socket:{
        host:"redis-11422.c62.us-east-1-4.ec2.cloud.redislabs.com",
        port: 11422
    }
    ,password:"AFahzbIs3wTxs0VMPnvTqkuqyoZOWXwV"
  });

async function prepareSentimentNews() {
    let mainObj = {"positive": [], "negative": []};
    let mainArticles = [];
    let promiseArr = [];
    await client.connect();
    let data = JSON.parse(await client.get('all_news'));
    await client.disconnect()
    let news = data.news;
    for(let i=0;i<news.length;i++) {
        let articles = news[i].articles;
        for(let j=0;j<5;j++) {
            let artObj = articles[j];
            mainArticles.push(artObj);
            promiseArr.push(query({"inputs":articles[j].title}));
    }
    }
    Promise.all(promiseArr).then(async(values)=>{
        for(let i=0;i<values.length;i++) {
            let res = values[i].data;
            let artObj = mainArticles[i];
            if(res && res[0] && res[0][0]){
                if(res[0][0].label === 'neutral'){
                    artObj['label'] = res[0][1].label;
                }
                else{
                    artObj['label'] = res[0][0].label;
                }
                if(artObj.label === 'positive')
                    mainObj.positive.push(artObj);
                else
                    mainObj.negative.push(artObj);
            }
        }
        await client.connect()
        // console.log(JSON.stringify(mainObj));
        await client.set("sentimentNews", JSON.stringify(mainObj));
        console.log("sentiment news done!!");
        await client.disconnect();
    }).catch(err=>console.log(err));
}
function query(data) {
	return axios.post(
		"https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
        data,
		{
			headers: { Authorization: "Bearer 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" }
		}
	);
}

app.get('/prepareSentimentNews', async (req, res)=>{
   res.send("ok");
   await prepareSentimentNews();
   console.log("completed")
});

// app.listen(4000, () => {
//     console.log('listening on port 4000');
// })

const server = http.createServer({}, app).listen(3000);

server.keepAliveTimeout = (60 * 1000) + 1000;
server.headersTimeout = (60 * 1000) + 2000;

// setInterval(async ()=>{
//  await prepareSentimentNews();
//  console.log("prepared!!");
// },600000);
