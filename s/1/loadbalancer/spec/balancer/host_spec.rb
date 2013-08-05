require 'spec_helper'
require 'pp'

describe Balancer::Host do
  let (:h) { Balancer::Host.new('www.yahoo.com/target') }
  let (:ok_response) { Typhoeus::Response.new(code: 200, body: 100) }
  let (:bad_response) { Typhoeus::Response.new(code: 404, body: 'not found') }

  before(:each) do
    # no outside calls
    Typhoeus.stub(/.*/).and_return(ok_response)
  end

  describe "init_with_string" do
    context "when the init string contains multiple fields" do
      let (:h) { Balancer::Host.new('address=localhost;target=target;port=80') }
      it "splits the fields and sets them" do
        expect(h.address).to eq('localhost')
        expect(h.target).to eq('target')
        expect(h.port).to eq('80')
      end
    end

    context "when the init string has no specified fields" do
      let (:h) { Balancer::Host.new('localhost:80/target') }
      it "assigns the address" do
        expect(h.address).to eq('localhost:80')
      end

      it "assigns the healthcheck target" do
        expect(h.target).to eq('target' )
      end
    end
  end

  describe ".load" do
    context "when a healthcheck has already run" do
      before { h.healthcheck }

      it "returns the last load number" do
        expect(h.load).to eq(100)
      end
    end

    context "when no healthcheck has been performed yet" do
      it "performs an on-demand healthcheck" do
        expect(h.last_response).to eq(nil)
        h.load
        expect(h.last_response).to be_instance_of(Typhoeus::Response)
      end
    end
  end

  describe ".healthcheck" do
    it "returns a boolean indiciating if the request succeeded" do
      expect(h.healthcheck).to eq(true)
    end

    context "when requesting the full response" do
      it "returns the response object" do
        expect(h.healthcheck(full_response: true)).to be_instance_of(Typhoeus::Response)
      end
    end
  end

  describe ".healthcheck_request" do
    subject { h.healthcheck_request }
    it { should be_instance_of(Typhoeus::Request) }
  end

  describe ".overloaded?" do
    subject { h.overloaded? }

    context "when the load_target is not specified" do
      it { should == false }
    end

    context "when the load_target is set" do
      context "when the load_target is greater than or equal to the current load" do
        before(:each) { h.load_target = 200 }
        it { should == false }
      end

      context  "when the load_target is less than the current load" do
        before(:each) { h.load_target = 50 }
        it { should == true }
      end
    end

  end

  describe ".up?" do
    subject { h.up? }
    it "returns the last known state" do
      expect(h.up?).to eq(true)
    end

    context "when the host is flapping" do
      before { h.stub(:flapping_score).and_return(300) }
      it { should == false }
    end
  end

  describe ".flapping_score" do
    subject { h.flapping_score }
    context "when no checks have occurred yet" do
      it { should == 0 }
    end

    context "when over 18 checks have occurred" do
      before do
        h.instance_eval { @state_history = 0xfffff }
      end

      it { should == 0 }
    end

    context "when the host has frequently changed state" do
      before do
        h.instance_eval { @state_history = 0xaaaaa }
      end

      # above the threshold
      it { should be > 0.3 }
    end
  end

end
