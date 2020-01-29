#!/bin/bash

prof="--profile lake"
dir=$1
files=`aws s3 ls $dir $prof`

for tif in $files; do
        #echo "$tif -> $ext"
        ext=${tif##*.}
        if [ $ext = "tif" ]; then
                ./translate_fn.sh $dir$tif
                #break
        fi
done
