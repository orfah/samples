<?php
class Domain extends db {
	var $url    = '',
		$domain = '',
		$desc   = '';
	
	function getDomain() {
        // remove the www
        $url = urldecode($this->url); 
        $url = preg_replace('/www\./', '', $url);
        $url = parse_url($url);
        if ($url) {
            $domain = (isset($url['host'])) ? $url['host'] : $url['path'];
            // remove any path items
            $domain = preg_replace("/\/.*/", '', $domain);
            // should be the remaining domain?
            return $domain;
        }
        return false;
	}
	
	function hasValidIP() {
		$domain = $this->domain;
        // gethostbyname returns ip or unmodified hostname on failure
        $ip = gethostbyname($domain);
        return ($ip != $domain);
	}
	
	function save() {
		try {
			if (!self::$dbh) $this->connect();
			$sql = "INSERT INTO domains SET domain_id='', name=:name, valid=:valid, description=:desc, ctime=:ctime";
			$stmt = self::$dbh->prepare($sql);
			return $stmt->execute(
									array(
										':name'=>$this->domain, 
										':valid'=>$this->valid, 
										':desc'=>$this->desc, 
										':ctime'=>time()
									));
		}
		catch (PDOException $e) {
            $this->fatal_error($e->getMessage());
		}	
	}
	
	/* 
	need to implement a paging/limit function for this, as the db grows this doesnt scale
	for now/prototype, this is ok.
	*/
	function loadi() {
		try {
			if (!self::$dbh) $this->connect();
			$sql = "SELECT name, valid, description, ctime FROM domains WHERE valid='y' ORDER BY ctime DESC";
			$stmt = self::$dbh->prepare($sql);
			$stmt->execute();
			
			$domains = array();
			
			while ($a = $stmt->fetch()) {
				$d = new Domain;
				$d->domain      = urldecode($a[0]);
				$d->valid       = $a[1];
				$d->desc        = urldecode($a[2]);
				$d->ctime       = $a[3];
				
				$domains[] = $d;
			}
			return $domains;
		}
		catch (PDOException $e) {
            $this->fatal_error($e->getMessage());	
		}
	}
	
	/* 
    this is just a convenience method to view non-valid domains
    could easily filter the valids at the controller or view level
	*/
	function loadall() {
		try {
			if (!self::$dbh) $this->connect();
			$sql = "SELECT name, valid, description, ctime FROM domains ORDER BY ctime DESC";
			$stmt = self::$dbh->prepare($sql);
			$stmt->execute();
			
			$domains = array();
			
			while ($a = $stmt->fetch()) {
				$d = new Domain;
				$d->domain      = urldecode($a[0]);
				$d->valid       = $a[1];
				$d->desc        = urldecode($a[2]);
				$d->ctime       = $a[3];
				
				$domains[] = $d;
			}
			return $domains;
		}
		catch (PDOException $e) {
            $this->fatal_error($e->getMessage());	
		}
    }
}

?>
