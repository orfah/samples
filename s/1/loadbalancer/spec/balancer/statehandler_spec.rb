require 'spec_helper'

describe Balancer::RedisState do
  let (:rs) { Balancer::RedisState.new }
  let(:key) { 'key' }
  let(:obj) { {'a' => 'b'} }
  let(:fake_redis) { double(:redis) }
  before do
    Redis.stub(:new).and_return(fake_redis)
    rs.name = 'test'
  end

  describe ".write" do
    subject { rs.write(key, obj) }

    before do
      fake_redis.stub(:set).and_return(true)
    end

    it "calls set" do
      fake_redis.should_receive(:set).exactly(1).times
      subject
    end

    it "converts the object to json" do
      obj.should_receive(:to_json)
      subject
    end
  end

  describe ".read" do
    subject { rs.read(key) }

    context "when the key does not exist" do
      before do
        fake_redis.stub(:get).and_return(nil)
      end

      it { should == {} }
    end

    context "when the key exists" do
      before do
        fake_redis.stub(:get).with(key).and_return(obj.to_json)
      end

      it { should == obj }
    end
  end

  describe ".last_check=" do
    before do
      fake_redis.stub(:set).and_return(true)
    end

    subject { rs.last_check = Time.now }

    it "calls set" do
      fake_redis.should_receive(:set).exactly(1).times
      subject
    end
  end

  describe ".last_check" do
    subject { rs.last_check }

    before do
      fake_redis.stub(:get).and_return(1000)
    end
    it "returns an instance of Time" do
      expect(subject).to be_instance_of(Time)
    end

    context "when there is no last check" do
      before do
        fake_redis.stub(:get).and_return(nil)
      end
      
      it "returns an instance of Time" do
        expect(subject).to be_instance_of(Time)
      end
    end

  end
end

describe Balancer::FileState do
  let (:fs) { Balancer::FileState.new }
  before(:each) { fs.name = 'test' }

  describe ".write" do
    subject { fs.write('path', {} )}
    let(:path) { "path" }
    before do
      File.stub('open').and_return([])
    end

    it "writes to the file" do
      File.should_receive(:open).with(path, 'w')
      subject
    end
  end

  describe ".read" do
    subject { fs.read('path') }
    context "when the path doesn't exist" do
      it { should == {} }
    end

    context "when the file is available" do
      let(:obj) { { "a" => 'b', "c" => 'd' } }
      before do
        File.stub(:exist?).and_return(true)
        File.stub(:read).and_return(obj.to_json)
      end

      it "parses the json object" do
        JSON.should_receive(:parse)
        subject
      end

      it { should == obj }
    end
  end

  describe "last_check_path" do
    subject { fs.last_check_path }

    it { should start_with("/tmp/")}
  end

  describe ".last_check=" do
    subject { fs.last_check = Time.now }
    before do
      File.stub(:open).and_return([])
      fs.stub(:last_check_path).and_return('path')
    end

    it "asks for the appropriate path" do
      fs.should_receive(:last_check_path).once
      subject
    end

    it "opens a writable file" do
      File.should_receive(:open).with('path', 'w')
      subject
    end
  end

  describe ".last_check" do
    subject { fs.last_check }
    before do
      File.stub(:exist?).and_return(true)
      File.stub(:mtime).and_return(Time.now)
    end

    it "returns an instance of Time" do
      expect(subject).to be_instance_of(Time)
    end

    context "when there is no last check" do
      before do
        File.stub(:exist?).and_return(false)
      end
      
      it "returns an instance of Time" do
        expect(subject).to be_instance_of(Time)
      end
    end
  end
end