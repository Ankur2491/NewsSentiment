const redis = require('redis');
var express = require('express');
var cors = require('cors');
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
    await client.connect();
    let data = JSON.parse(await client.get('all_news'));
    await client.disconnect()
    let news = data.news;
    for(let i=0;i<news.length;i++) {
        let articles = news[i].articles;
        // let articleArr=[];
        for(let j=0;j<10;j++) {
            let artObj = articles[j];
            let res = await query({"inputs":articles[j].title});
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
        // news[i].articles = articleArr;
        // mainObj.news.push(news[i]);
    }
    // console.log(JSON.stringify(mainObj));
    await client.connect()
    await client.set("sentimentNews", JSON.stringify(mainObj));
    console.log("sentiment news done!!");
    await client.disconnect();
}
async function query(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

app.get('/prepareSentimentNews', async (req, res)=>{
   await prepareSentimentNews();
   res.send("ok");
});

app.listen(4000, () => {
    console.log('listening on port 4000');
})