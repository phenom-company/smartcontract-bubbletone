# Universal Mobile Token Contract

## Code

`function transfer(address _to, uint _value) public returns (bool success)`
Transfers tokens.

`function approve(address _spender, uint _value) public returns (bool success)`
Approves token amount for spender.

`function transferFrom(address _from, address _to, uint _value) public returns (bool success)`
Transfers tokens from address within given approval.

`function addEmitter(address _emitter) public onlyOwner`
Adds an emitter.

`function removeEmitter(address _emitter) public onlyOwner`
Removes an emitter.

`function batchMint(address[] _adresses, uint[] _values) public onlyEmitter`
Mints tokens in batches.

`function batchTransfer(address[] _adresses, uint[] _values) public`
Transfers tokens in batches.

`function burn(address _from, uint _value) public onlyEmitter`
Burns tokens.

`function allowance(address tokenOwner, address spender) public constant returns (uint remaining)`
Checks spending allowance for the given owner.

`function balanceOf(address _tokenOwner) public constant returns (uint balance)`
Checks balance of the given owner.

## Prerequisites
1. nodejs, and make sure it's version above 8.0.0
2. npm
3. truffle
4. testrpc

## Run tests
 * run `truffle test` in another terminal to execute tests.
