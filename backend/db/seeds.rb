# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create sample messages for demonstration
sample_users = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"]
sample_messages = [
  "Hello everyone! 👋",
  "How's everyone doing today?",
  "This chat app is really cool!",
  "Testing the real-time features...",
  "Anyone here interested in Ruby on Rails?",
  "The WebSocket integration works great!",
  "Love the clean interface design.",
  "Rails + Action Cable = 💪",
  "Has anyone tried the pagination feature?",
  "The styling looks professional!",
  "Great work on this chat application.",
  "Real-time messaging is so smooth!",
  "The responsive design works well on mobile.",
  "This could be expanded into a full chat platform.",
  "The auto-refresh feature is handy.",
  "Thanks for building this demo!",
  "The code structure looks very clean.",
  "Action Cable makes WebSockets easy in Rails.",
  "Perfect example of modern web development.",
  "Looking forward to more features!"
]

# Only create sample data if there are no messages yet
if Message.count == 0
  puts "Creating sample messages..."

  sample_messages.each_with_index do |content, index|
    Message.create!(
      content: content,
      username: sample_users.sample,
      created_at: (20 - index).minutes.ago
    )
  end

  puts "Created #{Message.count} sample messages!"
else
  puts "Sample messages already exist (#{Message.count} messages found)"
end
