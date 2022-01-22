// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract ScrapMaster is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accCWolfPerShare;
        uint16 depositFee;
    }

    address public rewardsPoolAddress;
    address public feeAddress;
    uint256 public cWolfPerBlock;

    PoolInfo[] public poolInfo;
    mapping(address => bool) public addedPool;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;
    uint256 public totalLockedUpRewards;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    
    constructor(
        address _rewardsPoolAddress,
        uint256 _cWolfPerBlock,
        uint256 _startBlock,
        address _feeAddress
    ) {
        require(address(_rewardsPoolAddress) != address(0), "Token is a zero value");
        rewardsPoolAddress = _rewardsPoolAddress;
        cWolfPerBlock = _cWolfPerBlock;
        startBlock = _startBlock;

        feeAddress = _feeAddress;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
            return _to.sub(_from);
    }

    function add(uint256 _allocPoint, IERC20 _lpToken, uint16 _depositFee) public onlyOwner {
        require(addedPool[address(_lpToken)] == false, "Error: Duplicate pool");
        massUpdatePools();
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accCWolfPerShare: 0,
                depositFee: _depositFee
            })
        );
        addedPool[address(_lpToken)] == true;
    }

    function setAllocPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        massUpdatePools();
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    function setDepositFee(uint256 _pid, uint16 _depositFee) external onlyOwner {
        massUpdatePools();
        poolInfo[_pid].depositFee = _depositFee;
    }

    function pendingToken(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accCWolfPerShare = pool.accCWolfPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock,block.number);
            uint256 cWolfReward = multiplier.mul(cWolfPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accCWolfPerShare = accCWolfPerShare.add(cWolfReward.mul(1e12).div(lpSupply));
        }
        return  user.amount.mul(accCWolfPerShare).div(1e12).sub(user.rewardDebt).add(user.pendingRewards);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 cWolfReward = multiplier
            .mul(cWolfPerBlock)
            .mul(pool.allocPoint)
            .div(totalAllocPoint);
        cWolfToken.mint(address(this), cWolfReward);
        pool.accCWolfPerShare = pool.accCWolfPerShare.add(
            cWolfReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount, bool _withdrawRewards) public onlyEOA nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accCWolfPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                if (_withdrawRewards) {
                    user.pendingRewards = user.pendingRewards.add(pending);
                    safeTokenTransfer(msg.sender, user.pendingRewards);
                    emit Claim(msg.sender, _pid, user.pendingRewards);
                    user.pendingRewards = 0;
                }
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            if (pool.depositFee > 0) {
                uint256 depositFee = _amount.mul(pool.depositFee).div(10000);
                pool.lpToken.safeTransfer(feeAddress, depositFee);
                _amount = _amount.sub(depositFee);
            }
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accCWolfPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount, bool _withdrawRewards) public onlyEOA nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accCWolfPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            if (_withdrawRewards) {
                user.pendingRewards = user.pendingRewards.add(pending);
                safeTokenTransfer(msg.sender, user.pendingRewards);
                emit Claim(msg.sender, _pid, user.pendingRewards);
                user.pendingRewards = 0;
            }
        }
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accCWolfPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function emergencyWithdraw(uint256 _pid) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
    }

    function claim(uint256 _pid) public onlyEOA nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accCWolfPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0 || user.pendingRewards > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
            safeTokenTransfer(msg.sender, user.pendingRewards);
            emit Claim(msg.sender, _pid, user.pendingRewards);
            user.pendingRewards = 0;
        }
        user.rewardDebt = user.amount.mul(pool.accCWolfPerShare).div(1e12);
    }

    function safeTokenTransfer(address _to, uint256 _amount) internal {
        uint256 tokenBal = cWolfToken.balanceOf(address(rewardsPoolAddress));
        if (_amount > tokenBal) {
            IERC20(CWOLFContractAddress).transferFrom(
                rewardsPoolAddress,
                msg.sender,
                tokenBal
            );
            
        } else {
            IERC20(CWOLFContractAddress).transferFrom(
                rewardsPoolAddress,
                msg.sender,
                _amount
            );
        }
    }

    function setCWolfPerBlock(uint256 _cWolfPerBlock) external onlyOwner {
        require(_cWolfPerBlock > 0,"Token per block must be greather than zero");
        massUpdatePools();
        cWolfPerBlock = _cWolfPerBlock;
    }

    // Update dev address by the previous dev.
    function setFeeAddress(address _feeAddress) external onlyOwner {
        require(_feeAddress != address(0), "setFeeAddress: ZERO");
        feeAddress = _feeAddress;
    }
}