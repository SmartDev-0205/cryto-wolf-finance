//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Sale is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;

    mapping(address => uint256) public initialTokens;
    mapping(address => uint256) public claimedTokens;

    address private BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;

    address private beneficiaryAddress;
    // uint256 public tokenPrice = 8 * 1e17;
    address public cWolfTokenAddress;

    // Supply of the first presale (1,000,000 CWOLF)
    // uint256 public supplyFirstPresale = 1 * 1e6 * 1e18;

    // Suppply of the second presale (1,000,000 CWOLF)
    uint256 public remainingSupply = 1 * 1e6 * 1e18;
    bool presaleActive = true;

    uint256 minBUSD = 100 * 1e18;
    uint256 maxBUSD = 20000 * 1e18;

    uint256 private blockTimestamp20;
    uint256 private blockTimestamp40;
    uint256 private blockTimestamp60;
    uint256 private blockTimestamp80;
    uint256 private blockTimestamp100;

    event ChangePrice(uint256 _newPrice);
    event Claim(address indexed _address, uint256 _amountCWolf);

    event Buy(
        address indexed _address,
        uint256 _amountBUSD,
        uint256 _amountCWolf,
        uint256 _remainingSupply
    );

    constructor(address cWolfTokenAddress_) {
        cWolfTokenAddress = cWolfTokenAddress_;
        beneficiaryAddress = 0xa4276E56bBE7C73948380Fe894492D9B0C6DCe0e;
    }

    // function changePrice(uint256 _newPrice) public onlyOwner returns (bool) {
    //     tokenPrice = _newPrice;
    //     emit ChangePrice(_newPrice);
    //     return true;
    // }

    function addAddresses(
        address[] memory _addresses,
        uint256[] memory _amountTokens
    ) external onlyOwner {
        require(
            _addresses.length == _amountTokens.length,
            "Not equal dimensions"
        );

        for (uint256 index = 0; index < _addresses.length; index++) {
            initialTokens[_addresses[index]] =
                initialTokens[_addresses[index]] +
                _amountTokens[index];
        }
    }

    function maxAmountToClaim(address _address)
        internal
        view
        returns (uint256)
    {
        uint256 maxAmount;

        if (block.timestamp <= blockTimestamp20) {
            revert("Nothing to claim");
        } else if (
            blockTimestamp20 < block.timestamp &&
            block.timestamp <= blockTimestamp40
        ) {
            maxAmount = initialTokens[_address] * 20 / 100;
        } else if (
            blockTimestamp40 < block.timestamp &&
            block.timestamp <= blockTimestamp60
        ) {
            maxAmount = initialTokens[_address] * 40 / 100;
        } else if (
            blockTimestamp60 < block.timestamp &&
            block.timestamp <= blockTimestamp80
        ) {
            maxAmount = initialTokens[_address] * 60 / 100;
        } else if (
            blockTimestamp80 < block.timestamp &&
            block.timestamp <= blockTimestamp100
        ) {
            maxAmount = initialTokens[_address] * 80 / 100;
        } else if (block.timestamp > blockTimestamp100) {
            maxAmount = initialTokens[_address];
        }

        return maxAmount;
    }

    function toBeClaimed(address _address) external view returns (uint256) {
        return maxAmountToClaim(_address) - claimedTokens[_address];
    }

    function claim(uint256 _amountCWolfToClaim)
        external
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        uint256 maxAmount = maxAmountToClaim(msg.sender);

        require(
            _amountCWolfToClaim + claimedTokens[msg.sender] <= maxAmount,
            "Amount exceeded"
        );

        claimedTokens[msg.sender] =
            claimedTokens[msg.sender] +
            _amountCWolfToClaim;
        IERC20(cWolfTokenAddress).transfer(msg.sender, _amountCWolfToClaim);

        emit Claim(msg.sender, _amountCWolfToClaim);
        return true;
    }

    function buy(uint256 _amountBUSD)
        external
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(presaleActive, "Presale not active");

        require(_amountBUSD >= minBUSD, "Min amount is 100BUSD");
        require(_amountBUSD <= maxBUSD, "Max amount is 20000BUSD");

        uint256 amountWolf = (_amountBUSD / 8) * 10;
        require(
            initialTokens[msg.sender] + amountWolf <= maxBUSD,
            "Maximum Allocation is 20000BUSD"
        );
        require(
            remainingSupply - amountWolf >= 0,
            "Amount exceeds remaining supply"
        );
        require(
            IERC20(BUSD).balanceOf(msg.sender) >= _amountBUSD,
            "You dont have sufficient BUSD"
        );
        require(
            IERC20(BUSD).allowance(msg.sender, address(this)) >= _amountBUSD,
            "The contract does not have allowance"
        );

        IERC20(BUSD).safeTransferFrom(
            msg.sender,
            beneficiaryAddress,
            _amountBUSD
        );
        initialTokens[msg.sender] = initialTokens[msg.sender] + amountWolf;
        remainingSupply = remainingSupply - amountWolf;

        emit Buy(msg.sender, _amountBUSD, amountWolf, remainingSupply);
        return true;
    }

    function withdraw(uint256 _amount, address _to) external onlyOwner {
        uint256 _amountInContract = IERC20(BUSD).balanceOf(address(this));
        require(_amount <= _amountInContract, "Very high amount");
        IERC20(BUSD).safeTransfer(_to, _amount);
    }

    function remainingTokensUser(address _address)
        public
        view
        returns (uint256)
    {
        return initialTokens[_address] - claimedTokens[_address];
    }

    function setBlocksTimestamp(uint256[5] memory _newBlockTimestamps)
        external
        onlyOwner
        returns (bool)
    {
        require(
            _newBlockTimestamps.length == 5,
            "Provide 5 timestamps in seconds"
        );

        blockTimestamp20 = _newBlockTimestamps[0];
        blockTimestamp40 = _newBlockTimestamps[1];
        blockTimestamp60 = _newBlockTimestamps[2];
        blockTimestamp80 = _newBlockTimestamps[3];
        blockTimestamp100 = _newBlockTimestamps[4];

        return true;
    }

    function setWolfTokenAddress(address _newCWolfTokenAddress)
        external
        onlyOwner
        returns (bool)
    {
        cWolfTokenAddress = _newCWolfTokenAddress;
        return true;
    }

    function changePresaleState(bool _newPresaleState) external onlyOwner {
        presaleActive = _newPresaleState;
    }

    function pause() external onlyOwner returns (bool) {
        _pause();
        return true;
    }

    function unpause() external onlyOwner returns (bool) {
        _unpause();
        return true;
    }
}
