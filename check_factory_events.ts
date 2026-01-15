
import { ParinumFactoryEthereum__factory } from '@parinum/contracts/typechain-types';

const iface = ParinumFactoryEthereum__factory.createInterface();

const events = [
  'BuyerUnresolvedPurchase',
  'SellerUnresolvedPurchase',
  'BuyerCompletedPurchase',
  'SellerCompletedPurchase'
];

events.forEach(name => {
    const fragment = iface.getEvent(name);
    if (!fragment) {
        console.log(`${name}: Not found`);
        return;
    }
    console.log(`Event: ${name}`);
    console.log(`Topic0: ${fragment.topicHash}`);
    fragment.inputs.forEach((input: any, index: number) => {
        console.log(`  Arg ${index}: ${input.name} (${input.type}) indexed=${input.indexed}`);
    });
    console.log('---');
});
