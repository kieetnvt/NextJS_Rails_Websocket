class MessagesController < ApplicationController
  def index
    # Paginate messages for HTML view, order by most recent first for web interface
    @messages = Message.order(created_at: :desc).page(params[:page]).per(10)
    @message = Message.new # For the form

    respond_to do |format|
      format.html # Render HTML view with pagination
      format.json {
        # For JSON API, return all messages in chronological order
        render json: Message.order(created_at: :asc)
      }
    end
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

      respond_to do |format|
        format.html {
          redirect_to messages_path, notice: 'Message sent successfully!'
        }
        format.json {
          render json: @message, status: :created
        }
      end
    else
      respond_to do |format|
        format.html {
          # For HTML, paginate messages again and render with errors
          @messages = Message.order(created_at: :desc).page(params[:page]).per(10)
          render :index
        }
        format.json {
          render json: @message.errors, status: :unprocessable_entity
        }
      end
    end
  end

  private

  def message_params
    params.require(:message).permit(:content, :username)
  end
end
