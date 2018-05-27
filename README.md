# 简介
WsPusher是一个基于websocket协议的消息推送系统，现已实现服务端和web客户端

# 特点
1、消息队列池、状态数据池基于 Redis  
2、推送服务用nodejs实现，基于pm2实现分布式部署  
3、Producer(消息生产)端，基于http协议，测试结果证明可以按序存储数据 
4、Consumer(消息消费)端，基于socket.io实现，实现了掉线自动重连等功能，保证消息能收到且只收到一次  
5、支持同一用户多终端收消息；也支持为离线用户暂存消息，暂存时间长度可配置  
6、支持基于room和基于全项目的广播消息  

# 流程图
![](https://github.com/john-chow/wspusher/blob/master/20180526160545.jpg)

# benchmark 
部署在阿里云单核1G内存的云主机，测试结果:  
* Consumer端，使用测试工具 [websocket-bench](https://github.com/M6Web/websocket-bench)  
  最大并发量每秒30请求
  最大可连接数500    
* Producer端，
  阿里云PTS性能测试结果： 平均TPS为150次/秒
