pragma solidity ^0.4.24;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint a, uint b) internal pure returns (uint) {
    if (a == 0) {
      return 0;
    }
    uint c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint a, uint b) internal pure returns (uint) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint a, uint b) internal pure returns (uint) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint a, uint b) internal pure returns (uint) {
    uint c = a + b;
    assert(c >= a);
    return c;
  }
}

contract Token is Ownable {
    
    using SafeMath for uint;

    /*
        Standard ERC20 token
    */
    
    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

    // Name of token
    string public name;
    // Short symbol for token
    string public symbol;

    // Nubmer of decimal places
    uint public decimals;

    // Token's total supply
    uint public totalSupply;

    // Is minting active
    bool public mintingIsFinished;

    // Is transfer possible
    bool public transferIsPossible;

    modifier onlyEmitter() {
        require(emitters[msg.sender] == true);
        _;
    }
    
    mapping (address => uint) public balances;
    mapping (address => bool) public emitters;
    mapping (address => mapping (address => uint)) internal allowed;
    
    constructor() Ownable() public {
        name = "Universal Mobile Token";
        symbol = "UMT";
        decimals = 18;   
        // Make Owner also an emitter
        emitters[msg.sender] = true;
    }

    function finishMinting() public onlyOwner {
        mintingIsFinished = true;
        transferIsPossible = true;
    }

    function transfer(address _to, uint _value) public returns (bool success) {
        // Make transfer only if transfer is possible
        require(transferIsPossible);

        require(_to != address(0));
        require(_value <= balances[msg.sender]);
        
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint _value) public returns (bool success) {
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        // Make transfer only if transfer is possible
        require(transferIsPossible);

        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function addEmitter(address _emitter) public onlyOwner {
        emitters[_emitter] = true;
    }
    
    function removeEmitter(address _emitter) public onlyOwner {
        emitters[_emitter] = false;
    }
    
    function batchMint(address[] _adresses, uint[] _values) public onlyEmitter {
        require(_adresses.length == _values.length);
        for (uint i = 0; i < _adresses.length; i++) {
            require(minted(_adresses[i], _values[i]));
            emit Transfer(address(0), _adresses[i], _values[i]);
        }
    }

    function batchTransfer(address[] _adresses, uint[] _values) public {
        require(_adresses.length == _values.length);
        for (uint i = 0; i < _adresses.length; i++) {
            require(transfer(_adresses[i], _values[i]));
            emit Transfer(msg.sender, _adresses[i], _values[i]);
        }
    }

    function burn(address _from, uint _value) public onlyEmitter {
        // Burn tokens only if minting stage is not finished
        require(!mintingIsFinished);

        require(_value <= balances[_from]);
        balances[_from] = balances[_from].sub(_value);
        totalSupply = totalSupply.sub(_value);
    }

    function allowance(address tokenOwner, address spender) public constant returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }

    function balanceOf(address _tokenOwner) public constant returns (uint balance) {
        return balances[_tokenOwner];
    }

    function minted(address _to, uint _value) internal returns (bool) {
        // Mint tokens only if minting stage is not finished
        require(!mintingIsFinished);

        balances[_to] = balances[_to].add(_value);
        totalSupply = totalSupply.add(_value);
        return true;
    }
}
