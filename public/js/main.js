'use strict';

var app = {

  rooms: function(user){

    var socket = io('/rooms', { transports: ['websocket'] });

    // When socket connects, get a list of chatrooms
    socket.on('connect', function () {

      // Update rooms list upon emitting updateRoomsList event
      socket.on('updateRoomsList', function(room) {

        // Display an error message upon a user error(i.e. creating a room with an existing title)
        $('.room-create p.message').remove();
        if(room.error != null){
          $('.room-create').append(`<p class="message error">${room.error}</p>`);
        }else{
          app.helpers.updateRoomsList(room);
        }
      });

      // Whenever the user hits the create button, emit createRoom event.
      $('.room-create button').on('click', function(e) {
        var inputEle = $("input[name='title']");
        var roomTitle = inputEle.val().trim();
        if(roomTitle !== '') {
          socket.emit('createRoom', roomTitle);
          inputEle.val('');
        }
      });

    });
  },

  chat: function(roomId, username){
    
    var socket = io('/chatroom', { transports: ['websocket'] });

      // When socket connects, join the current chatroom
      socket.on('connect', function () {

        socket.emit('join', roomId);

        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function(users,connections, clear) {

          $('.container p.message').remove();
          if(users.error != null){
            $('.container').html(`<p class="message error">${users.error}</p>`);
          }else{
            app.helpers.updateUsersList(users, connections, clear);
          }
        });

        // Whenever the user hits the save button, emit newMessage event.
        $(".chat-message button").on('click', function(e) {

          var textareaEle = $("textarea[name='message']");
          var messageContent = textareaEle.val().trim();
          if(messageContent !== '') {
            var message = { 
              content: messageContent, 
              username: username,
              date: Date.now()
            };

            socket.emit('newMessage', roomId, message);
            textareaEle.val('');
            app.helpers.addMessage(message);
          }
        });
        socket.on('online_user',function(userId){
          $('li#user-'+ userId +' .status .fa').removeClass('offline').addClass('online');
        });

        // Whenever a user leaves the current room, remove the user from users list
        socket.on('removeUser', function(userId) {
          //$('li#user-' + userId).remove();
          $('li#user-'+ userId +' .status .fa').removeClass('online').addClass('offline');
          app.helpers.updateNumOfUsers();
        });

        socket.on('listInitMessage',function(messages){
          app.helpers.updateListMessage(messages);
        });

        // Append a new message 
        socket.on('addMessage', function(message) {
          app.helpers.addMessage(message);
        });
      });
  },

  helpers: {

    encodeHTML: function (str){
      return $('<div />').text(str).html();
    },

    updateListMessage(messages){
      messages.forEach(function(message){
        message.lt      = (new Date(message.lt)).toLocaleString();
        console.log("message content: " + message.c);
        message.c     = app.helpers.encodeHTML(message.c);
        message.n   = app.helpers.encodeHTML(message.n);

        var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.n}</span>
                      <span class="message-data-time">${message.lt}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.c}</div>
                  </li>`;
        $(html).hide().appendTo('.chat-history ul').slideDown(200);
      });
      $(".chat-history").animate({ scrollTop: $('.chat-history')[messages.length].scrollHeight}, 1000);
    },

    // Update rooms list
    updateRoomsList: function(room){
      room.title = this.encodeHTML(room.title);
      var html = `<a href="/chat/${room.mid}"><li class="room-item">${room.n}</li></a>`;

      if(html === ''){ return; }

      if($(".room-list ul li").length > 0){
        $('.room-list ul').prepend(html);
      }else{
        $('.room-list ul').html('').html(html);
      }
      
      this.updateNumOfRooms();
    },

    // Update users list
    updateUsersList: function(users, connections, clear){
        if(users.constructor !== Array){
          users = [users];
        }

        var html = '';
        for(var user of users) {
          var online_class = 'offline';
          console.log('Connections:' + connections);
          for(var con of connections){
            if(con.aid === user.aid){
              online_class = 'online';
            }
          }
          var user_name = this.encodeHTML(user.n);
          html += `<li class="clearfix" id="user-${user.aid}">
                     <img src="${user.pic}" alt="${user_name}" />
                     <div class="about">
                        <div class="name">${user_name}</div>
                        <div class="status"><i class="fa fa-circle ${online_class}"></i></div>
                     </div></li>`;
        }

        if(html === ''){ return; }

        if(clear != null && clear == true){
          $('.users-list ul').html('').html(html);
        }else{
          $('.users-list ul').prepend(html);
        }

        this.updateNumOfUsers();
    },
    offlineUser: function(user_id){
      $('li#user-${user.aid} .status .fa').removeClass('online').addClass('offline');
    },

    // Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.username);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    },

    // Update number of rooms
    // This method MUST be called after adding a new room
    updateNumOfRooms: function(){
      var num = $('.room-list ul li').length;
      $('.room-num-rooms').text(num +  " Room(s)");
    },

    // Update number of online users in the current room
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function(){
      var num = $('.users-list ul li').length;
      $('.chat-num-users').text(num +  " User(s)");
    }
  }
};
