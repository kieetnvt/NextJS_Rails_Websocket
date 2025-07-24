class ApplicationController < ActionController::Base
  # Protect from forgery attacks for HTML forms
  protect_from_forgery with: :exception

  # Skip CSRF protection for API requests (JSON format)
  skip_before_action :verify_authenticity_token, if: :json_request?

  private

  def json_request?
    request.format.json?
  end
end
