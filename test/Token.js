const Token = artifacts.require('Token');

async function assertRevert(promise) {
    try {
        await promise;
        assert.fail('Expected revert not received');
    } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        const invalidOpcodeFound = error.message.search('invalid opcode') >= 0;
        assert(revertFound || invalidOpcodeFound, `Expected "revert" or "invalid opcode", got ${error} instead`);
    }
};

contract('Token', function ([_, owner, recipient, anotherAccount]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        this.token = await Token.new({from: owner});
    });

    describe('minting', function() {
        
        describe('when minting is not finished', function() {
            it('should mint tokens for one address', async function() {
                await this.token.batchMint([recipient], [100], {from: owner});
                const balance = await this.token.balanceOf(recipient);
                assert.equal(balance, 100);
            });

            it('should mint tokens for several addressses', async function() {
                const recepients = [owner, recipient, anotherAccount];
                const balances = [100, 200, 300];
                await this.token.batchMint(recepients, balances, {from: owner});

                for (let i = 0; i < recepients.length; i++) {
                    const balance = await this.token.balanceOf(recepients[i]);
                    assert.equal(balances[i], balance);
                }
            })
        });

        describe('when minting is finished', function() {
            it('reverts', async function() {
                await this.token.finishMinting({from: owner});
                await assertRevert(this.token.batchMint([recipient], [100], {from: owner}));
            })
        });

        describe('from emitters', function() {
            beforeEach(async function() {
                await this.token.addEmitter(anotherAccount, {from: owner});
            });

            it('should allow to add an emitter', async function() {
                const isEmitter = await this.token.emitters(anotherAccount);
                assert.equal(isEmitter, true);
            });

            it('should be able to mint from emitter', async function() {
                await this.token.batchMint([owner], [100], {from: anotherAccount});
                const balance = await this.token.balanceOf(owner);
                assert.equal(balance, 100);
            });
        });

        describe('trying to finish minting from another account', function() {
            it('reverts', async function() {
                assertRevert(this.token.finishMinting({from: anotherAccount}));
            })
        });
    })

    describe('total supply', function () {
        it('should have zero initial total supply', async function () {
            const totalSupply = await this.token.totalSupply();

            assert.equal(totalSupply, 0);
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                const balance = await this.token.balanceOf(anotherAccount);

                assert.equal(balance, 0);
            });
        });

        describe('when has some tokens', function() {
            it('is not zero', async function() {
                this.token.batchMint([recipient], [100], {from: owner});

                const balance = await this.token.balanceOf(recipient);

                assert.equal(balance, 100);
            })
        })
    });

    describe('transfer', function () {
        describe('when token is transferable', function() {

            beforeEach('mint tokens and make token transferable', async function() {
                await this.token.batchMint([owner], [100], {from: owner});
                await this.token.finishMinting({from: owner});
            })
            
            describe('when the recipient is not the zero address', function () {
                const to = recipient;

                describe('when the sender does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transfer(to, amount, { from: owner }));
                    });
                });

                describe('when the sender has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.token.transfer(to, amount, { from: owner });

                        const senderBalance = await this.token.balanceOf(owner);
                        assert.equal(senderBalance, 0);

                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });
                });
            });

            describe('when the recipient is the zero address', function () {
                const to = ZERO_ADDRESS;

                it('reverts', async function () {
                    await assertRevert(this.token.transfer(to, 100, { from: owner }));
                });
            });
        });

        describe('when token is untransferable', function() {
            const to = recipient

            it('reverts', async function () {
                await this.token.batchMint([owner], [100], {from: owner});;
                await assertRevert(this.token.transfer(to, 100, { from: owner }));
            }); 
        })
    });

    describe('approve', function () {
        beforeEach('mint tokens and make them transferable', async function() {
                await this.token.batchMint([owner], [100], {from: owner});
                await this.token.finishMinting({from: owner});  
        });

        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                const amount = 100;

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.approve(spender, amount, { from: owner });

                        const allowance = await this.token.allowance(owner, spender);
                        assert.equal(allowance, amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    it('reverts', async function () {
                        await this.token.approve(spender, 2, { from: owner });

                        await assertRevert(this.token.approve(spender, 2, {from: owner}));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = 101;
                
                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.approve(spender, amount, { from: owner });

                        const allowance = await this.token.allowance(owner, spender);
                        assert.equal(allowance, amount);
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = 100;
            const spender = ZERO_ADDRESS;

            it('approves the requested amount', async function () {
                await this.token.approve(spender, amount, { from: owner });

                const allowance = await this.token.allowance(owner, spender);
                assert.equal(allowance, amount);
            });
        });
    });

    describe('transfer from', function () {
        const spender = recipient;

        describe('when the recipient is not the zero address', function () {
            const to = anotherAccount;

            describe('when the spender has enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.batchMint([owner], [100], {from: owner});;
                    await this.token.finishMinting({from: owner});
                    await this.token.approve(spender, 100, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const senderBalance = await this.token.balanceOf(owner);
                        assert.equal(senderBalance, 0);

                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });

                    it('decreases the spender allowance', async function () {
                        await this.token.transferFrom(owner, to, amount, { from: spender });

                        const allowance = await this.token.allowance(owner, spender);
                        assert(allowance.eq(0));
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });

            describe('when the spender does not have enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.approve(spender, 99, { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = 100;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });
        });

        describe('when the recipient is the zero address', function () {
            const amount = 100;
            const to = ZERO_ADDRESS;

            beforeEach(async function () {
                await this.token.approve(spender, amount, { from: owner });
            });

            it('reverts', async function () {
                await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
        });
    });

    describe('burning', function() {
        beforeEach(async function() {
            await this.token.batchMint([anotherAccount], [100], {from: owner});
        })
        
        describe('when minting is finished', function() {
            it('should not be able to burn tokens', async function() {
                await this.token.finishMinting({from: owner});
                assertRevert(this.token.burn(anotherAccount, 100, {from: owner}));
            })
        });
        
        describe('when minting is not finished', function() {
            it('should be able to burn tokens', async function() {
                await this.token.burn(anotherAccount, 100, {from: owner});
                const balance = await this.token.balanceOf(anotherAccount);
                assert.equal(balance, 0);
            })
        });

    })
});