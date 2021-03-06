// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time
pragma solidity 0.8.10;

import "@openzeppelin/contracts/utils/math/Math.sol";

library OrderLib {
    struct Ask {
        uint256 time;
        uint256 deadline;
        address maker;
        address exchange;
        address srcToken;
        address dstToken;
        uint256 srcAmount;
        uint256 srcBidAmount;
        uint256 dstMinAmount;
    }

    struct Bid {
        uint256 time;
        address taker;
        address exchange;
        bytes data;
        uint256 amount;
        uint256 fee;
    }

    struct Fill {
        uint256 time;
        uint256 amount;
    }

    struct Order {
        uint256 id;
        Ask ask;
        Bid bid;
        Fill filled;
    }

    function newOrder(
        uint256 id,
        address exchange,
        address srcToken,
        address dstToken,
        uint256 srcAmount,
        uint256 srcBidAmount,
        uint256 dstMinAmount,
        uint256 deadline
    ) internal view returns (Order memory) {
        return
            Order(
                id,
                Ask(
                    block.timestamp,
                    deadline,
                    msg.sender,
                    exchange,
                    srcToken,
                    dstToken,
                    srcAmount,
                    srcBidAmount,
                    dstMinAmount
                ),
                newBid(),
                Fill(
                    0, // time
                    0 // amount
                )
            );
    }

    function newBid() internal pure returns (Bid memory) {
        return
            Bid(
                0, // time
                address(0), // taker
                address(0), // exchange
                new bytes(0), // data
                0, // amount
                0 // fee
            );
    }

    function srcBidAmountNext(Order memory self) internal pure returns (uint256) {
        return Math.min(self.ask.srcBidAmount, self.ask.srcAmount - self.filled.amount);
    }

    function dstMinAmountNext(Order memory self) internal pure returns (uint256) {
        return
            Math.min(
                self.ask.dstMinAmount,
                (self.ask.dstMinAmount * (self.ask.srcAmount - self.filled.amount)) / self.ask.srcBidAmount
            );
    }
}
