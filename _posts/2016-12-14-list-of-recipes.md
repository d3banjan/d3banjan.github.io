---
layout: post
title: List of interesting recipes
summary: recipe list
category: software
tags: notes linux
---

## pdf concatenation server
While a set of articles are being downloaded (in the requisite order) at low speed because I didn't want the server to be overwhelmed, I rename the pdfs and move them to a subdirectory, and concatenate them to the same file. Over the next hour, the owncloud server updates the pdf while I read it on my ereader. :) 

### possible improvements
- if download happens in the correct order, this can be improved to a scheme where once concatenated files are not concatenated again. 
- generate makefile and create targets to create a binary tree such that updates take minimal computational effort - too  fancy! 

```
    set -x
    while sleep 300 
    do for file in `find -maxdepth 1 | grep fulltext | grep -v html`
        do mv $file pdfs/$file.pdf
        done
        pdfunite pdfs/*.pdf ~/ownCloud/Documents/resonance.pdf
    done
```
