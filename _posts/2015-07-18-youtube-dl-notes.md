---
layout:		post
title: 		YouTube-dl install notes
summary:	starting from Ubuntu 14.04.2 LTS - trying to make YouTube-dl work led me down a tunnel.
metatag: 	software
categories:	install-notes
---

The version of YouTube-dl in the repositories doesn't work for playlists anymore.  

1. Download the recent version, and copy it to a directory in the system path

   	    sudo wget https://yt-dl.org/latest/youtube-dl -O /usr/local/bin/youtube-dl 
	    sudo chmod a+x /usr/local/bin/youtube-dl
	    sudo ln -s /usr/local/bin/youtube-dl /usr/bin/youtube-dl

2. Install yasm

   	   sudo apt-get install yasm

3. Get the recent version of avconv from their (website)[https://libav.org/releases/libav-11.4.tar.gz]. Extract it and go into the directory - and follow up with those magic lines - 

       	   ./configure 
   	   make
   	   (sudo) make install
   
