---
layout: post
title: Notes about "recordmydesktop"
summary: some interesting things about the abovementioned linux tool for screencapture
category: software
tags: notes linux
---
`recordmydesktop` is a nice linux tool for making screencasts. Most operational problems are taken away if one installs the gui frontend called `gtk-recordmydesktop`. What follows here is a list of observations, how things went wrong for me, how to solve them and what not to do in the future.

### observations

* The man page is very nice. The notes at the end read :
<blockquote> An easy way to find out the id of a window, is by using the xwininfo program. <br> Running a command like :  <br> xwininfo | awk ´/Window id:/ {print $4}´  <br> will give you only the id of the window(which should look like this: 0x4800005) <br>  More conviniently you can put all that in the command that  launches  recordMyDesktop   like this:  <br> ~$recordmydesktop --windowid $(xwininfo | awk ´/Window id:/ {print $4}´)   </blockquote>
* Using the window-selection in the gui using this underlying `--windowid` seems to be the best option, more so because the gui implements a persistent rectangle on the window on which the mouse hovers. However `recordmydesktop` would only record the area of the screen that the window occupied at the beginning. It doesn't track the window, as one might expect.  
* The following was something I wished I had noticed before I recorded out my hour long screencast.

 > Also, the lower quality you select on a video recording ( -v_quality option), the
 > highest CPU-power that you will need.
 > So if you are doing the encoding on the fly ,it's better to start with default values
 > and manipulate the end-result with another program.

 Note that the default value is `--v_quality 63`.
 
 This brings me to a very frustrating topic ...

## `recordmydesktop` is very bad at encoding!!

The encoding process uses exactly one cpu core and could crash depending on how long the process runs. For an hour long screencast, this is a lot of time! There is no way to tweak it to improve it's performance on the multi-threaded side, but there are options if your gui instance crashes. There are two ways to recover the project :

 1. **Identify the cache directory** : the argument you passed after `--workdir` (if not, the default value is `\tmp\` ). Identify the folder called `rMD-session-XXXX` as the one belonging to the crashed job.
 2. **Solution using the GUI**: create a new screencapture process. you shall see a new folder appear in `\tmp\` called `rMD-session-YYYY`.
    1. Delete the contents of `rMD-session-YYYY` and replace it with the contents of `rMD-session-XXXX`
    2. Stop the recording
Now this will start the encoding process on the cached files from the earlier crashed session. Funnily enough, expect to see that the rendering process bar goes above 100% .
 3. **Solution using the commandline** : Here you identify the same cache folder from earlier, and then run the following in the terminal:
    ```
    recordmydesktop --rescue /tmp/rMD-session-XXXX
    ```
 Any other options that you pass would be ignored. The options from the earlier session shall be used instead.

### post-rant summary

* do not change the default `v_quality`
* if you crash, you know how to rescue the data 
* try to change `--workdir` to something other than `\tmp\`. you do not want your cached files to be deleted after a restart.
* do all the transcoding in `ffmpeg` or `avconv` afterwards. 

