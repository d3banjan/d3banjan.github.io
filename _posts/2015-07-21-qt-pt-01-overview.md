---
layout:	post
title:  Qt Notes 01
summary: Overview and strategy for teaching myself Qt systematically.
categories: self-teaching-notes, qt, qml
---
The problem with learning a mature tool/framework like `Qt` is that there is a lot of boilerplate code to be written to get to the relatively simple problem that I am trying to solve by myself. Here I try to compile a list of resources I found useful in my quest to teach myself `Qt`, with some commentary on their usefulness to my present state. There is some dearth of resources, however, that establish the organization and philosophy of `Qt` development libraries/framework/tools for beginners like me.  

##Resources 

### Video Tutorials  

While I did find some nice resources online, the primary one being [the C++ Qt GUI video tutorial series by VoidRealms on YouTube](https://www.youtube.com/watch?v=6KtOzh0StTc&list=PL2D1942A4688E9D63). What bugged me a lot was that this series relies heavily on using Qt Creator as an IDE, and that it is completely hands on and pragmatic in its approach to teaching Qt. I would have preferred being introduced to the organization of the libraries and the philosophy before diving in the tutorials and demos. 

I also zipped through [the C++ series by the same channel](https://www.youtube.com/watch?v=vQr3fljHizc&list=PL2F919ADECA5E39A6) which was awesome for me because I am well versed with fortran and the language features were faster to pick up here. I do not think this C++ series is a good idea for someone who is being introduced to a compiled language for the first time. This tutorial also uses Microsoft Visual Studio heavily as an IDE and would have done better without it. 



[The video tutorials by newboston on YouTube](https://www.youtube.com/playlist?list=PLD0D54219E5F2544D) were more up my alley -- because of its insistence on introducing the code first and then GUI features of `Qt Creator` to accomplish that goal, or not. This is much more introductory than the one by VoidRealms. And much shorter. 

### The Qt Docs
The [official Qt documentation](http://doc.qt.io/qt-5) was, surprisingly, the last place I looked for an overview of the Qt Toolchain, or atleast the toolchain that I would end up using the most later on. I would urge anyone who finds my learning path similar to their own to go through the following pages in the `Qt` Docs. I tried to write down a quick guide for looking through :  

#### [**About Qt**](http://wiki.qt.io/About_Qt)
>Qt is a **cross-platform** application development framework for desktop, embedded and mobile. 

The best thing about `Qt` is that you can compile the same source code to run on Windows, Linux or Android. Although Graphical Elements are a large part of the `Qt` library, it provides additional tools to simplify common problems that come up in application development - like APIs for network programming, multimedia, SQL, webkit elements and widgets or unit testing.  

>Qt is not a programming language by its own. It is a **framework** written in C++.

> Before the compilation step, the [MOC(Meta-Object Compiler)](http://doc.qt.io/qt-5/moc.html) parses the source files written in **Qt-extended C++** and generates **standard compliant C++** sources from them. 

So, Qt-Extended C++ **---MOC--->>** C++ **---GCC/other compiler--->>** Executable

####[**Qt Modules**](http://doc.qt.io/qt-5/qtmodules.html)
This table from the above-mentioned page on `Qt` modules is a nice resource to visualize the organization of the core modules.

|    Module	    	      |	      Description									             |
|-----------------------------|------------------------------------------------------------------------------------------------------|
|	Qt Core		      |		Core non-graphical classes used by other modules.					     |
|	Qt GUI	   	      |		Base classes for graphical user interface (GUI) components. Includes OpenGL.		     |
|	Qt Multimedia	      |		Classes for audio, video, radio and camera functionality.				     |
|	Qt Multimedia Widgets |		Widget-based classes for implementing multimedia functionality.				     |
|	Qt Network 	      |		Classes to make network programming easier and more portable.				     |
|	Qt QML	      	      |		Classes for QML and JavaScript languages.					 	     |
|	Qt Quick      	      |		A declarative framework for building highly dynamic applications with custom user interfaces.| 
|	Qt Quick Controls     |		Reusable Qt Quick based UI controls to create classic desktop-style user interfaces.	     |
|	Qt Quick Dialogs      |		Types for creating and interacting with system dialogs from a Qt Quick application.	     |
|	Qt Quick Layouts      |		Layouts are items that are used to arrange Qt Quick 2 based items in the user interface.     |
|	Qt SQL	 	      |		Classes for database integration using SQL.   	       	       	  	  	      	     |
|	Qt Test	 	      |		Classes for unit testing Qt applications and libraries.					     |
|	Qt WebKit (Deprecated)|		Classes for a WebKit2 based implementation and a QML API. Deprecated in favor of Qt WebEngine.|
|	Qt WebKit Widgets (Deprecated)|	WebKit1 and QWidget-based classes from Qt 4. 	    	       	  	      		     |
|	Qt Widgets	      |		  Classes to extend Qt GUI with C++ widgets.	    	    				     |

#### [**`Qt` reference pages**](http://doc.qt.io/qt-5/reference-overview.html)
This is not a resource by itself but this is pretty good as a gateway to information that would be invaluable once we actually start using `Qt` hands on. 

#### [**Examples and Tutorials**](http://doc.qt.io/qt-5/qtexamplesandtutorials.html)
This is a similarly valuable **"gateway"** resource that would come in handy for reading simple blocks of understandable and well commented code later on. 

#### [**All Overviews**](http://doc.qt.io/qt-5/overviews.html)
This is a list of all **overviews**, i.e a strongly hierarchical documentation that culminates in a highly detailed page on specific topics. I would probably use these for reference and not for initial studying.

#### [**QML and Qt Quick**](http://doc.qt.io/qt-5/qmlapplications.html) 
This describes the QML language in detail that can be used for rapid protyping development as Qt Quick projects and also as an API sometimes.

>Qt Quick is the standard library of types and functionality for QML. It includes visual types, interactive types, animations, models and views, particle effects and shader effects. 


 