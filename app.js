/*
* 项目依赖的模块文件
* */
//express框架
var express = require("express");
//socket.io模块
var socket_io = require('socket.io');

//实例化app应用
var app = express();

//设置允许跨域
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});
//数据库连接成功后开启服务器，开启聊天室
var socket_server = socket_io.listen(app.listen(4000,function (err) {
    if(err){
        console.log("聊天室开启失败......")
    }else{
        console.log("聊天室开启成功,端口为4000......")
    }
}));
/*socket配置
socket.emit 给当前用户发送消息
socket.broadcast.emit 给聊天室在线的其他所有用户发消息
*/
//初始化用户列表数组
var user_list = [];
//监听客户端连接聊天室事件
socket_server.sockets.on('connection',function (socket) {
    //用户加入聊天室
    socket.on('join',function(user){
        //检查当前用户列表数组中是否已有该用户
        var array = user_list.some((v, i, a) => {
            return v.username == user.username;
        });
        //如果当前用户列表数组中没有该用户，则将该用户插入到用户列表中
        if(array == false){
            var new_user = {
                id:socket.id,
                username:user.username,
                userimg:user.userimg
            };
            user_list.push(new_user);
        }
        //实时返回给当前用户最新用户列表与欢迎消息
        socket.emit('new_user',{
            online_user:user_list,
            msg_content:`系统消息：欢迎来到智云社区聊天室！`,
        });
        //实时返回给聊天室其他人最新用户列表与欢迎消息
        socket.broadcast.emit('others_new_user',{
            online_user:user_list,
            msg_content: `系统消息：欢迎${user.username}进入聊天室`,
        });
    });
    //实时接收用户发送的消息，并实时转发给当前用户和所有用户
    socket.on('send',function(msg_data){
        socket.emit('new_message',{
            type: `${msg_data.type}`,
            userimg: `${msg_data.userimg}`,
            username: `${msg_data.username}`,
            send_time: `${msg_data.send_time}`,
            msg_content: `${msg_data.msg_content}`,
        });
        socket.broadcast.emit('others_new_message',{
            userimg: `${msg_data.userimg}`,
            username: `${msg_data.username}`,
            send_time: `${msg_data.send_time}`,
            msg_content: `${msg_data.msg_content}`,
        });
    });
    //用户主动点击退出聊天室
    socket.on('quit',function(user){
        //实时监听用户下线，并从用户列表中删除该用户
        for (var key in user_list) {
            //实时根据用户端返回的用户名从用户列表中找出当前下线用户
            if (user_list[key].id === socket.id) {
                user_list.splice(key,1)
            }
        };
        //实时返回给聊天室其他人下线用户的用户id
        socket.broadcast.emit('others_user_quit',{
            id: socket.id,
        });
    });

    //用户被动退出聊天室(关闭浏览器或者产生其他错误原因导致退出)
    socket.on("disconnect", function(){
        //实时监听用户下线，并从用户列表中删除该用户
        for (var key in user_list) {
            //实时根据用户端返回的用户名从用户列表中找出当前下线用户
            if (user_list[key].id === socket.id) {
                user_list.splice(key,1)
            }
        };
        //实时返回给聊天室其他人下线用户的用户id
        socket.broadcast.emit('others_user_quit',{
            id: socket.id,
        });
    })
});
//捕捉项目全局进程中的错误和异常，统一处理
process.on('unhandledRejection', function (error) {
    if (error) {
        return false;
    }
});
