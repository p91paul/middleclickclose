#!/bin/bash
rm -rf middleclickclose@paolo.tranquilli.gmail.com.zip
cd middleclickclose@paolo.tranquilli.gmail.com/
glib-compile-schemas schemas
zip -r ../middleclickclose@paolo.tranquilli.gmail.com.zip * -x '*.po'
