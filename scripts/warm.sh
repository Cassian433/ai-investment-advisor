#!/bin/bash
# Keeps the market caches warm so first paint is instant.
B=http://127.0.0.1:8011/api
W="RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,ICICIBANK.NS,ITC.NS,GOLDBEES.NS,BTC-INR"
curl -s -m 20 "$B/prices" >/dev/null
curl -s -m 20 "$B/quotes?tickers=$W" >/dev/null
curl -s -m 20 "$B/history?tickers=$W&range=1m" >/dev/null
curl -s -m 20 "$B/history?tickers=RELIANCE.NS&range=3m" >/dev/null
curl -s -m 20 "$B/news" >/dev/null
curl -s -m 20 -X POST "$B/analyse" -H 'content-type: application/json' -d '{"amount":500000,"horizon_years":5,"risk":50}' >/dev/null
