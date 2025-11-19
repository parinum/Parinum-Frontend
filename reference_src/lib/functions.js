import { ethers } from 'ethers'
import { paysecCloneABI } from './paysecCloneInfo';
import { paysecFactoryABI } from './paysecFactoryInfo';
import { pscABI } from './pscInfo';
import { crowdfunderABI } from './crowdfunderInfo';
import { rewardsPoolABI } from './rewardsPoolInfo';
import erc20ABI from './erc20Info';

import { paysecCloneAddress, paysecFactoryAddress, pscAddress, crowdfunderAddress, rewardsPoolAddress } from './addresses';

export const initProvider = async () => {
    let provider;
    let signer;

    let paysecClone;
    let paysecFactory;
    let psc;
    let crowdfunder;
    let rewardsPool;

    let paysecCloneRead;
    let paysecFactoryRead;
    let pscRead;
    let crowdfunderRead;
    let rewardsPoolRead;

    try {
        provider = new ethers.BrowserProvider(window.ethereum, 'any');
        const accounts = await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        paysecFactory = new ethers.Contract(paysecFactoryAddress, paysecFactoryABI, signer);
        paysecClone = new ethers.Contract(paysecCloneAddress, paysecCloneABI, signer);
        psc = new ethers.Contract(pscAddress, pscABI, signer);
        crowdfunder = new ethers.Contract(crowdfunderAddress, crowdfunderABI, signer);
        rewardsPool = new ethers.Contract(rewardsPoolAddress, rewardsPoolABI, signer);

        paysecFactoryRead = new ethers.Contract(paysecFactoryAddress, paysecFactoryABI, provider);
        paysecCloneRead = new ethers.Contract(paysecCloneAddress, paysecCloneABI, provider);
        pscRead = new ethers.Contract(pscAddress, pscABI, provider);
        crowdfunderRead = new ethers.Contract(crowdfunderAddress, crowdfunderABI, provider);
        rewardsPoolRead = new ethers.Contract(rewardsPoolAddress, rewardsPoolABI, provider);

        return { provider, signer, paysecFactory, paysecClone, psc, crowdfunder, rewardsPool, paysecFactoryRead, paysecCloneRead, pscRead, crowdfunderRead, rewardsPoolRead };
    } catch (error) {
        console.log(error);
    }
};

export const createPurchase = async (seller, price, collateral, tokenAddress) => {
    let signer, paysecFactory;
    ({ signer, paysecFactory } = await initProvider());

    if (tokenAddress == ethers.AddressZero || tokenAddress == "0") {
        console.log("initiating eth purchase")
        price = ethers.parseEther(price);
        collateral = ethers.parseEther(collateral);
        const createContractTx = await paysecFactory.createContract();
        console.log("created contract")
        const createContractReceipt = await createContractTx.wait();
        const purchaseAddress = createContractReceipt.logs[0].address.toString();
        const purchase = new ethers.Contract(purchaseAddress, paysecCloneABI, signer);
        const createPurchaseTx = await purchase.createPurchase(seller, price, collateral, ethers.ZeroAddress, { value: price + collateral });
        console.log("created purchase")
        await createPurchaseTx.wait();
        alert("Purchase ID: " + purchaseAddress);
        return purchaseAddress;
    }
    else {
        console.log("initiating token purchase")
        const token = new ethers.Contract(tokenAddress, erc20ABI, signer)
        const tokenDecimals = await token.decimals();
        price = ethers.parseUnits(price, tokenDecimals);
        collateral = ethers.parseUnits(collateral, tokenDecimals);

        const createContractTx = await paysecFactory.createContract();
        const createContractReceipt = await createContractTx.wait();
        const purchaseAddress = createContractReceipt.logs[0].address.toString();
        const purchase = new ethers.Contract(purchaseAddress, paysecCloneABI, signer);
        const approveTokensTx = await token.approve(purchase.target, price + collateral);
        await approveTokensTx.wait();
        const createPurchaseTx = await purchase.createPurchase(seller, price, collateral, tokenAddress);
        await createPurchaseTx.wait();
        alert("Purchase ID: " + purchaseAddress);
        return purchaseAddress;
    }
};

export const abortPurchase = async (purchaseId) => {
    let signer;
    ({ signer } = await initProvider());

    const purchase = new ethers.Contract(purchaseId, paysecCloneABI, signer);
    await purchase.abortPurchase(purchaseId);
};

export const confirmPurchase = async (purchaseId) => {
    let signer;
    ({ signer } = await initProvider());
    const purchase = new ethers.Contract(purchaseId, paysecCloneABI, signer);
    const tokenAddress = await purchase.tokenAddress();
    const collateral = await purchase.collateral();

    if (tokenAddress == ethers.ZeroAddress) {
        await purchase.confirmPurchase({ value: collateral });
    }
    else {
        //approve token
        const token = new ethers.Contract(tokenAddress, erc20ABI, signer)
        await token.approve(purchaseId, collateral);
        await purchase.confirmPurchase();
    }
};

export const releasePurchase = async (purchaseId) => {
    let signer;
    ({ signer } = await initProvider());
    const purchase = new ethers.Contract(purchaseId, paysecCloneABI, signer);
    await purchase.releasePurchase();
};

export const claimRewardsandWithdrawStake = async () => {
    let rewardsPool;
    ({ rewardsPool } = await initProvider());
    await rewardsPool.claimRewardsandWithdrawStake();
};

export const claimRewardsandResetStake = async (stakeTime) => {
    let rewardsPool;
    ({ rewardsPool } = await initProvider());
    await rewardsPool.claimRewardsandResetStake(BigInt(stakeTime));
};

export const createNewStake = async (amount, stakeTime) => {
    let rewardsPool;
    ({ rewardsPool } = await initProvider());
    await rewardsPool.newStake(BigInt(amount), BigInt(stakeTime));
}

export const getPurchaseLogs = async (account) => {
    let paysecFactoryRead;
    ({ paysecFactoryRead } = await initProvider());

    const resolvedBuyFilter = paysecFactoryRead.filters.BuyerCompletedPurchase(account);
    const unresolvedBuyFilter = paysecFactoryRead.filters.BuyerUnresolvedPurchase(account);
    const resolvedSellFilter = paysecFactoryRead.filters.SellerCompletedPurchase(account);
    const unresolvedSellFilter = paysecFactoryRead.filters.SellerUnresolvedPurchase(account);

    const resolvedBuyLogs = await paysecFactoryRead.queryFilter(resolvedBuyFilter)
    console.log("resolved buys: ");
    console.log(resolvedBuyLogs);
    const unresolvedBuyLogs = await paysecFactoryRead.queryFilter(unresolvedBuyFilter);
    console.log("unresolved buys: ");
    console.log(unresolvedBuyLogs);
    const resolvedSellLogs = await paysecFactoryRead.queryFilter(resolvedSellFilter)
    console.log("resolved sells: ");
    console.log(resolvedSellLogs);
    const unresolvedSellLogs = await paysecFactoryRead.queryFilter(unresolvedSellFilter);
    console.log("unresolved sells: ");
    console.log(unresolvedSellLogs);

    let totalVolume = 0;
    for (let i = 0; i < unresolvedSellLogs.length; i++) {
        const args = unresolvedSellLogs[i].args;
        totalVolume += Number(ethers.formatEther(args.ethValue));
    }
    for (let i = 0; i < unresolvedBuyLogs.length; i++) {
        const args = unresolvedBuyLogs[i].args;
        totalVolume += Number(ethers.formatEther(args.ethValue));
    }

    return { resolvedBuyLogs: resolvedBuyLogs, unresolvedBuyLogs: unresolvedBuyLogs, resolvedSellLogs: resolvedSellLogs, unresolvedSellLogs: unresolvedSellLogs, totalVolume: totalVolume };
};


//returns in wei
export const getStakeInfo = async () => {
    console.log("getting dividend info")
    let rewardsPoolRead, provider;
    ({ rewardsPoolRead, provider } = await initProvider());
    const account = await (await provider.getSigner()).getAddress();
    console.log("Account: " + account)
    let stakes = await rewardsPoolRead.stakes(account);
    let totalAmount, totalRewardAmount, availableAmount, availableRewardAmount = 0;
    while(stakes.length > 0) {
        let stake = stakes[0];
        stakes[0] = stakes[stakes.length - 1];
        stakes.pop();
        let timeIncentive = await rewardsPoolRead.timeIncentive();
        let thisWeightedStake = stake.amount + timeIncentive * stake.amount * stake.stakeTime / 2592000n;
        let rewardAmount = (rewardsPoolRead.dividendPerStake() - stake.dividendPerStakeWithdrawn) * thisWeightedStake / (10n ** 18n);

        if(await provider.getBlock('latest').timestamp - stake.startTime >= stake.stakeTime){
            availableAmount += stake.amount;
            availableRewardAmount += rewardAmount;
        }
        totalRewardAmount += rewardAmount;
        totalAmount += stake.amount;
    }
    return {totalAmount, totalRewardAmount, availableAmount, availableRewardAmount};
}

export const getStakeInfoByIndex = async (stakeIndex) => {
    console.log("getting dividend info")
    let rewardsPoolRead, provider;
    ({ rewardsPoolRead, provider } = await initProvider());
    const account = await (await provider.getSigner()).getAddress();
    console.log("Account: " + account)
    let stakes = await rewardsPoolRead.stakes(account);
    let amount, rewardAmount, availableAmount, availableRewardAmount = 0;
    let stake = stakes[stakeIndex];
    let timeIncentive = await rewardsPoolRead.timeIncentive();
    let thisWeightedStake = stake.amount + timeIncentive * stake.amount * stake.stakeTime / 2592000n;
    rewardAmount = (rewardsPoolRead.dividendPerStake() - stake.dividendPerStakeWithdrawn) * thisWeightedStake / (10n ** 18n);
    if(await provider.getBlock('latest').timestamp - stake.startTime >= stake.stakeTime){
        availableAmount += stake.amount;
        availableRewardAmount += rewardAmount;
    }

    return {amount, rewardAmount, availableAmount, availableRewardAmount};
}
//FUNDING FUNCTIONS
//requires change or deletion since no longer using LP mechanism
export const calculateIcoPrice = async (ethAmount) => {
    let crowdfunderRead;
    ({ crowdfunderRead } = await initProvider());
    try {
        ethAmount = ethers.parseEther(ethAmount);
        console.log(ethAmount)
        const poolPSC = await crowdfunderRead.poolPSC();
        const poolETH = await crowdfunderRead.poolETH();
        //amountPSC = poolPSC * msg.value /(poolETH + msg.value);
        /*console.log("PoolPSC: " + poolPSC);
        console.log("PoolETH: " + poolETH);
        console.log("EthAmount: " + ethAmount);*/
        let outputAmount = poolPSC * ethAmount / (poolETH + ethAmount) * 95n / 100n;
        outputAmount = ethers.formatEther(outputAmount);
        let price = ethAmount / outputAmount;
        return (outputAmount).toString();
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

export const getIcoInfo = async () => {
    let crowdfunderRead;
    ({ crowdfunderRead } = await initProvider());
    try {
        const poolPSC = await crowdfunderRead.poolPSC();
        const poolETH = await crowdfunderRead.poolETH();
        const weightedETHRaised = await crowdfunderRead.weightedETHRaised();
        const deploymentTime = await crowdfunderRead.deploymentTime();
        const timeLimit = await crowdfunderRead.timeLimit();
        return {poolPSC, poolETH, deploymentTime, timeLimit, weightedETHRaised}
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

export const buyTokens = async (referer, amount) => {
    let crowdfunder;
    ({ crowdfunder } = await initProvider());
    if(amount == "") amount = "0"
    amount = ethers.parseEther(amount);
    if (referer == "") referer = ethers.ZeroAddress;
    try {
        const buyTokensTx = await crowdfunder.buyPSC(referer, { value: amount });
        const buyTokensReceipt = await buyTokensTx.wait();
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

export const claimTokens = async () => {
    try {
        let crowdfunder;
        ({ crowdfunder } = await initProvider());
        const claimTokensTx = await crowdfunder.claimPSC();
        const claimTokensReceipt = await claimTokensTx.wait();
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

export const getAccountIcoInfo = async (account) => {
    try {
        let crowdfunderRead;
        ({ crowdfunderRead } = await initProvider());
        const accountContributor = await crowdfunderRead.contributors(account);
        const contribution = accountContributor.contribution;
        const weightedContribution = accountContributor.weightedContribution;
        const ethReceived = accountContributor.ethReceived;
        const pscWithdrawn = accountContributor.pscWithdrawn;
        return {contribution, weightedContribution, ethReceived, pscWithdrawn};
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

/*export const getAccountClaim = async (account) => {
    try{
        const {contribution, weightedContribution, ethReceived, pscWithdrawn} = await getAccountIcoInfo(account);
        const {poolPSC, poolETH, deploymentTime, timeLimit, weightedETHRaised} = await getIcoInfo();
        const multiplier = weightedContribution / contribution;
        const cliffPeriod = timeLimit * (multiplier);
        const amount = poolPSC * weightedContribution / weightedETHRaised;
        const currentBlock = await provider.getBlock('latest');
        const elapsedVestingTime = currentBlock.timestamp - (deploymentTime + cliffPeriod);
        const vestingTime = timeLimit * multiplier / ratioDivisor;
        if(elapsedVestingTime > vestingTime) elapsedVestingTime = vestingTime;
        const unlockedAmount = amount * elapsedVestingTime / vestingTime;
        const amountToWithdraw = unlockedAmount - pscWithdrawn;
        export {amountToWithdraw, vestingTime, elapsedVestingTime, amount, unlockedAmount}
    }
}*/