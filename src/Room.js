import React, { useState, useEffect, useCallback } from 'react';
import Video, { LocalDataTrack } from 'twilio-video';
import Participant from './Participant';

const Room = ({ roomName, token, handleLogout }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [receivedChat, setReceivedChat] = useState("");

  useEffect(() => {
    const participantConnected = participant => {
      setParticipants(prevParticipants => [...prevParticipants, participant]);
    };

    const participantDisconnected = participant => {
      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p !== participant)
      );
    };


    Video.connect(token, {
      name: roomName, tracks: [new LocalDataTrack()]
    }).then(room => {
      setRoom(room);
      room.on('participantConnected', participantConnected);
      room.on('participantDisconnected', participantDisconnected);
      room.participants.forEach(participantConnected);
    });

    return () => {
      setRoom(currentRoom => {
        if (currentRoom && currentRoom.localParticipant.state === 'connected') {
          currentRoom.localParticipant.tracks.forEach(function(trackPublication) {
            trackPublication.track.stop();
          });
          currentRoom.disconnect();
          return null;
        } else {
          return currentRoom;
        }
      });
    };
  }, [roomName, token]);

  const handleChatMessageChange = useCallback(event => {
    setChatMessage(event.target.value);
  }, []);

  const handleReceivedMessage = useCallback(data => {
    setReceivedChat(data);
  }, []);

 

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (chatMessage) {
      // Get the LocalDataTrack that we published to the room.
      const [localDataTrackPublication] = [...room.localParticipant.dataTracks.values()];

      // Construct a message to send
      const fullMessage = `${room.localParticipant.identity} says: ${chatMessage}`;

      // Send the message
      localDataTrackPublication.track.send(fullMessage);
    }
  };



  const remoteParticipants = participants.map(participant => (
    <Participant key={participant.sid} participant={participant} receivedChat = {handleReceivedMessage}/>
  ));

  return (
    <div className="room">
      <h2>Room: {roomName}</h2>
      <button onClick={handleLogout}>Log out</button>
      <div className="local-participant">
        {room ? (
          <Participant
            key={room.localParticipant.sid}
            participant={room.localParticipant}
            receivedChat = {handleReceivedMessage}
          />
        ) : (
          ''
        )}
      </div>
     
      <h3>Remote Participants</h3>
      <div className="remote-participants">{remoteParticipants}</div>
      <h3>CHAT</h3>
      <div style={{display: "flex", justifyContent: "center", height: "30px"}}>
      
      <input
          type="text"
          id="room"
          value={chatMessage}
          onChange={handleChatMessageChange}
          required
        />
      <button style={{position: "relative", marginLeft: "60px"}} onClick={handleSendMessage}>send message</button>
      <label>Chat: {receivedChat}</label>
      </div>
    </div>
    
  );
};

export default Room;
