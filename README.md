# API

```
curl -X POST http://localhost:3000/api/upload

response:Data uploaded successfully
```
```
/api/engineer/avg

{
    "average_compensation": {
        "value": 216062.89490006893
    }
}
```
```
/api/compensation

{
    "totalCities": 2918,
    "cities": [
        {
            "city": "jakarta",
            "dataPoints": 2,
            "averageSalary": 195000000,
            "minSalary": 90000000,
            "maxSalary": 300000000,
            "usdAverageSalary": null
        },{
            "city": "hyderabad",
            "dataPoints": 1,
            "averageSalary": 4500000,
            "minSalary": 4500000,
            "maxSalary": 4500000,
            "usdAverageSalary": null
        },...................
        .............
```

api/query

```
{
    "average_compensation": {
        "value": 101930.30508474576
    },
    "salary_stats": {
        "count": 295,
        "min": 30000,
        "max": 1000000,
        "avg": 101930.30508474576,
        "sum": 30069440
    },
    "top_locations": {
        "doc_count_error_upper_bound": 0,
        "sum_other_doc_count": 0,
        "buckets": []
    },
    "top_records": [
        {
            "job_title": "Developer",
            "annual_salary": 1000000,
            "currency": "USD",
            "location": "Indiana"
        }...............................
        .............................
    ]
}
```

# Docs

docker pull elasticsearch:8.8.0

sudo docker run --rm --name elasticsearch_container --net elastic -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -e "xpack.security.enabled=false" elasticsearch:8.8.0

sudo docker run --rm --name elasticsearch_container --net elastic -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:8.8.0

docker build -t nodeapp .

docker run -d --name nodeapp -p 3030:3030 --link elasticsearch:elasticsearch nodeapp

docker logs --follow nodeapp