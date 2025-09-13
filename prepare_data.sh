#!/usr/bin/env bash
mkdir -p data
cat docs/*.txt > data/all_docs.txt
wc -c data/all_docs.txt