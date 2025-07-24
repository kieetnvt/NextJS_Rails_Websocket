class MessagesController < ApplicationController
  def index
    @messages = Message.order(created_at: :asc)
    render json: @messages
  end

  def create
    @message = Message.new(message_params)

    if @message.save
      # Broadcast the message to all connected clients
      ChatChannel.broadcast_to("chat_room", {
        id: @message.id,
        content: @message.content,
        username: @message.username,
        created_at: @message.created_at
      })

      render json: @message, status: :created
    else
      render json: @message.errors, status: :unprocessable_entity
    end
  end

  private

  def message_params
    params.require(:message).permit(:content, :username)
  end
end
