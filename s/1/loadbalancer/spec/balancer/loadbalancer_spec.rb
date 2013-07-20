require 'spec_helper'

describe Balancer do
  let(:lb)   { Balancer::LoadBalancer.new('balancer') }
  let(:h1)   { Balancer::Host.new('localhost/test1') }
  let(:h2)   { Balancer::Host.new('localhost/test2') }

  describe ".host" do
    before(:each) do
      lb.hosts = [h1, h2]

      h1.load_target = 100
      h1.asym_target = 100

      h2.load_target = 100
      h2.asym_target = 200
    end

    context "when the balancer is round-robin" do
      it "picks the first host in the queue" do
        expect( lb.host ).to eq(h1)
      end

      context "when host is called a second time" do
        it "picks the next host in the queue" do
          expect(lb.host).to eq(h1)
          expect(lb.host).to eq(h2)
        end
      end
    end

    context "when the balancer is lfb" do
      before { 
        lb.mode = Balancer::LoadBalancer::LFB_MODE
        h1.stub(:load).and_return(95)
        h2.stub(:load).and_return(30)
      }

      it "picks the least loaded host" do
        expect(lb.host).to eq(h2)
      end
    end

    context "when the balancer is random" do
      before { lb.mode = Balancer::LoadBalancer::RANDOM_MODE }

      it "picks any host" do
        expect(lb.host).to be_instance_of(Balancer::Host)
      end
    end

    context "when the balancer is asym" do
      let(:random_values) { [50, 250, 101] }
      before(:each) do
        lb.mode = Balancer::LoadBalancer::ASYM_MODE
        # 1/3, 2/3 chance to pick
        Kernel.stub(:rand).and_return(*random_values)
      end

      it "picks the host proportionally" do
        expect(lb.host).to eq(h1)
        expect(lb.host).to eq(h2)
        expect(lb.host).to eq(h2)
      end

       context "when the rng gives us bad numbers" do
         let(:random_values) { [299, 299, 299, 299, 299, 299, 299, 299, 299, 299] }

         it "default returns the first host" do
           expect(lb.host).to eq(h1)
         end
       end
    end

    context "when the user/host mapping is persistent" do
      let (:ok_response) { Typhoeus::Response.new(code: 200, body: 100) }
      before do
        lb.persistent = true
        h2_hash = h2.hash
        lb.instance_eval { @persist_map = { 'test-user' => h2_hash } }
        Balancer::Host.any_instance.stub(:up?).and_return(true)
        Typhoeus.stub(/.*/).and_return(ok_response)
      end

      [ Balancer::LoadBalancer::RANDOM_MODE, Balancer::LoadBalancer::ROUND_ROBIN_MODE,
        Balancer::LoadBalancer::ASYM_MODE, Balancer::LoadBalancer::LFB_MODE].each do |mode|
        context "when in #{mode} mode" do
          it "consistently returns the same host" do
            lb.mode = mode
            expect(lb.host('test-user')).to eq(h2)
            expect(lb.host('test-user')).to eq(h2)
          end
        end
      end

      context "when the persistent host is down" do
        before { h2.stub(:up?).and_return(false) }

        it "returns a host that is up" do
          expect(lb.host('test-user').up?).to eq(true)
        end
      end
    end
  end

  describe ".check" do
    let(:req)   { Typhoeus::Request.new('yahoo.com') }
    let (:ok_response) { Typhoeus::Response.new(code: 200, body: 100) }

    before do
      Typhoeus.stub(/.*/).and_return(ok_response)
      # having issues using any_instance to stub...?
      # Typhoeus::Hydra.any_instance.stub(:run).and_return(true)
      # Balancer::Host.any_instance.stub(:healthcheck_request).and_return(req)
      h1.stub(:healthcheck_request).and_return(req)
      h2.stub(:healthcheck_request).and_return(req)
      lb.stub(:log_state).and_return(true)
      lb.stub(:alert_state_change).and_return(true)
      lb.hosts = [h1, h2] 
    end

    it "runs a check against each host" do
      h1.should_receive(:healthcheck_request)
      h2.should_receive(:healthcheck_request)
      lb.check
    end
  end

  describe ".log_state" do
    before(:each) do
      lb.hosts = [h1, h2] 
      h2.instance_eval { @state = false }
    end

    it "asks the hosts what their state is" do
      h1.should_receive(:state).once
      h2.should_receive(:state).once
      lb.log_state
    end

    it "returns the state of the world" do
      state = lb.log_state
      state.should be_instance_of(Hash)
      expect(state[h1.id]).to eq(h1.state)
      expect(state[h2.id]).to eq(h2.state)
    end
  end

  describe ".alert_state_change" do
    let(:alert_hook)   { lambda { |h| true } }
    before do 
      lb.hosts = [h1, h2]
      lb.stub(:state).and_return( { h1.id => 'up', h2.id => 'up' } )
    end

    context "when the alert hook is not defined" do
       it "does not throw an error" do
         expect { lb.alert_state_change }.to_not raise_error
       end
    end

    context "when the alert hook is defined" do
      before do
        lb.stub(:state).and_return( { h1.id => 'flapping', h2.id => 'up' } )
        lb.alert_hook = alert_hook
      end

      it "calls the alert hook" do
        alert_hook.should_receive(:call).once
        lb.alert_state_change
      end
    end
  end

  describe ".add_host" do
    before { lb.hosts = [h1] }

    it "adds the host to list of hosts" do
      lb.add_host h2
      expect(lb.hosts).to eq([h1, h2])
    end
  end

  describe ".remove_host" do
    before { lb.hosts = [h1, h2] }

    it "adds the host to list of hosts" do
      lb.remove_host h2
      expect(lb.hosts).to eq([h1])
    end

  end

  describe ".ttl_expired?" do
    subject { lb.ttl_expired? }
    context "when the state of the world has not been checked yet" do
       it "does not throw an error" do
         expect { lb.ttl_expired? }.to_not raise_error
       end
    end

    context "when the ttl has expired" do
      before { lb.instance_eval { @last_check_time = Time.now - 100000 } }
      it { should == true }
    end

    context "when the ttl is fresh" do
      before { lb.instance_eval { @last_check_time = Time.now - 10 } }
      it { should == false }
    end
  end
end
