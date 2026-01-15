
import { ethers } from 'ethers';
import { ParinumCloneEthereum__factory } from '@parinum/contracts/typechain-types/index';

const iface = ParinumCloneEthereum__factory.createInterface();

['PurchaseCreated', 'PurchaseConfirmed', 'PurchaseReleased', 'PurchaseAborted'].forEach(name => {
    const fragment = iface.getEvent(name as any);
    if (!fragment) {
        console.log(`${name}: Not found`);
        return;
    }
    console.log(`Event: ${name}`);
    console.log(`Topic0: ${fragment.topicHash}`);
    fragment.inputs.forEach((input, index) => {
        console.log(`  Arg ${index}: ${input.name} (${input.type}) indexed=${input.indexed}`);
    });
    console.log('---');
});
