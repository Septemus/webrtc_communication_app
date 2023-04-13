var ip
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; //compatibility for Firefox and chrome
if (!RTCPeerConnection) {

  let win = iframe.contentWindow;
  RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
}
var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};      
pc.createDataChannel(''); //create a bogus data channel
pc.createOffer(pc.setLocalDescription.bind(pc), noop); // create offer and set local description
pc.onicecandidate = function(ice){
    if (ice && ice.candidate && ice.candidate.candidate){
       ip = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
       console.log('my IP: ', ip);   
       pc.onicecandidate = noop;
     }
};
try{
  if(!ip) ip=/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(window.location.href)[1]
}catch(err){
  ip='localhost'
}
