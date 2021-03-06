require 'sinatra'
require 'sinatra/base'
require "less"
require "haml"

class FrontEnd < Sinatra::Base
  autoload :SprocketsHelper, "helpers/sprockets_helper"
  include SprocketsHelper

  configure :development do
    enable :logging, :dump_errors, :raise_errors
    set :show_exceptions, true
  end

  configure :production do
    enable :logging
  end

  configure do
    set :root, File.expand_path("../", __FILE__)
  end

  before do
    check_and_create_sprockets
  end

  get '/app.css' do
    content_type 'text/css', :charset => 'utf-8'
    less :stylesheet
  end

  get '/' do
    haml :index
  end

  get '/:stream' do
    haml :stream
  end
end
