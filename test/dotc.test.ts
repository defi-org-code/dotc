import { account, useChaiBN, web3 } from "@defi.org/web3-candies";
import {
  ask,
  bid,
  describeOnETH,
  dotc,
  dstToken,
  exchange,
  expectFilled,
  fill,
  initFixture,
  order,
  srcToken,
  withMockExchange,
} from "./base.test";
import { mineBlock } from "@defi.org/web3-candies/dist/hardhat";
import { expect } from "chai";

useChaiBN();

describeOnETH("DOTC", async () => {
  beforeEach(initFixture);

  it("single chunk", async () => {
    await ask(2000, 2000, 1);
    await bid(0);
    await mineBlock(10);
    await fill(0);

    await expectFilled(0, 2000, 1);
  });

  it("mutiple chunks", async () => {
    await ask(10_000, 2500, 1.25);

    for (let i = 1; i <= 4; i++) {
      await bid(0);
      await mineBlock(10);
      await fill(0);
      await expectFilled(0, 2500 * i, 1.25 * i);

      await mineBlock(60);
    }

    await expectFilled(0, 10_000, 5);
  });

  it("last chunk may be partial amount", async () => {
    await ask(10_000, 4000, 2);

    await bid(0);
    await mineBlock(10);
    await fill(0);
    await mineBlock(60);

    await bid(0);
    await mineBlock(10);
    await fill(0);
    await mineBlock(60);

    await expectFilled(0, 8000, 4);

    await bid(0);
    await mineBlock(10);
    await fill(0);
    await expectFilled(0, 10_000, 5);
  });

  it("outbid current bid within pending period", async () => {
    await ask(2000, 1000, 0.5);

    await bid(0);
    await mineBlock(1);

    await withMockExchange(0.6);
    await bid(0);

    await mineBlock(10);
    await fill(0);
    await expectFilled(0, 1000, 0.59); // 0.01 taker fee
  });

  it("outbid current bid within pending period same path and amount but lower fee", async () => {
    await ask(2000, 1000, 0.5);

    await bid(0);
    expect((await order(0)).bid.fee).bignumber.eq(await dstToken.amount(0.01));
    await mineBlock(1);

    await dotc.methods
      .bid(
        0,
        exchange.options.address,
        web3().eth.abi.encodeParameter("address[]", [srcToken.address, dstToken.address]),
        await dstToken.amount(0.001)
      )
      .send({ from: await account(5) });

    expect((await order(0)).bid.taker).eq(await account(5));
    expect((await order(0)).bid.fee).bignumber.eq(await dstToken.amount(0.001));
  });
});
