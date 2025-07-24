class ChatChannel < ApplicationCable::Channel
  def subscribed
    stream_for "chat_room"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def receive(data)
    # Handle incoming messages from the client
    message = Message.create!(
      content: data['content'],
      username: data['username']
    )

    # Broadcast the message to all connected clients
    ChatChannel.broadcast_to("chat_room", {
      id: message.id,
      content: message.content,
      username: message.username,
      created_at: message.created_at
    })
  end
end
