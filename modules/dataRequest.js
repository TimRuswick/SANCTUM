var request = require('sync-request');
require('dotenv').config({path: '../.env'});

module.exports = {
  loadServerData: function(dataToLoad, usersID = ''){
    var res = request('GET', `http://skullboxstudios.com/projects/sanctum/botserver/getData.php?pk=${process.env.SERVER_PASS_KEY}&dataToLoad=` + dataToLoad + '&userid=' + usersID);
    console.log(res.getBody());
    return res.getBody();
  },
  
  sendServerData: function(dataType, dataToSend, usersID = '', dataToSend2 = ''){
    var res = request('GET', `http://skullboxstudios.com/projects/sanctum/botserver/sendData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=` + dataType + '&dataToSend=' + dataToSend  + '&dataToSend2=' + dataToSend2 + '&userid=' + usersID);
    console.log(res.getBody());
    return res.getBody();
  },
  
  sendAttackData: function(dataType, dataToSend, dataToSend2 = ''){
    var res = request('GET', `http://skullboxstudios.com/projects/sanctum/botserver/sendPostData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=` + dataType + '&dataToSend=' + dataToSend  + '&dataToSend2=' + dataToSend2)
    console.log(res.getBody());
    return res.getBody();
  },
  
  // Possibly unused?
  postServerData: function(dataType, dataToPost, dataToSend2 = ''){
    var res = request('POST', `http://skullboxstudios.com/projects/sanctum/botserver/sendPostData.php?pk=${process.env.SERVER_PASS_KEY}&dataType=` + dataType  + '&dataToSend2=' + dataToSend2, dataToPost)
    console.log(res.getBody());
    return res.getBody();
  }
}