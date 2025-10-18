import axios from 'axios';
import { delay } from './helpers';
import { Transaction } from './types';

// Define the structure of the wallet response
interface Wallet {
  balance: number;
  total_payout: number;
  total_revenue: number;
  pending_payout: number;
  ledger_balance: number;
}

interface WithdrawalRequest {
  amount: number;
  vatAmount: number;
  totalAmount: number;
}

export async function fetchUser() {
  try {
    const user = await axios.get('https://fe-task-api.mainstack.io/user');
    return user.data;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

export async function fetchWallet(): Promise<Wallet> {
  try {
    const wallet = await axios.get('https://fe-task-api.mainstack.io/wallet');
    return wallet.data;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    throw error;
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const transactions = await axios.get('https://fe-task-api.mainstack.io/transactions');
    return transactions.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function handleWithdrawal({
  amount,
  vatAmount,
  totalAmount,
}: WithdrawalRequest) {
  await delay(Math.floor(Math.random() * 500) + 300); // Simulate API delay

  try {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    // ✅ Fetch wallet data first
    const wallet = await fetchWallet();

    // ✅ Check available balance
    if (totalAmount > wallet.balance) {
      throw new Error('Insufficient balance for withdrawal');
    }

    // ✅ Create new withdrawal transaction
    const newTransaction: Transaction = {
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      date: new Date().toISOString(),
      metadata: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        type: 'withdrawal',
      },
      payment_reference: `REF${Date.now()}`,
    };

    // ✅ Compute new wallet balances (don’t mutate the old one)
    const updatedWallet: Wallet = {
      ...wallet,
      balance: wallet.balance - totalAmount,
      pending_payout: wallet.pending_payout + totalAmount,
      ledger_balance: wallet.ledger_balance - totalAmount,
    };

    // ✅ Optionally fetch existing transactions (if you want to append locally)
    const transactions = await fetchTransactions();
    const updatedTransactions = [newTransaction, ...transactions];

    return {
      transaction: newTransaction,
      wallet: updatedWallet,
      transactions: updatedTransactions,
      success: true,
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    throw error;
  }
}

export async function getWithdrawalHistory() {
  try {
    const transactions = await fetchTransactions();
    return transactions.filter((t) => t.type === 'withdrawal');
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return [];
  }
}
