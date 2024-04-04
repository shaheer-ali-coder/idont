const TelegramBot = require('node-telegram-bot-api');
var convertapi = require('convertapi')('UzmQnYl81wbo4qEI');
const { jsPDF } = require('jspdf');
const html2canvas = require('html2canvas');
const { fromPath } = require('pdf2pic');
const fs = require("fs")
// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const token = '7165940218:AAETwmjwE_9ZuhPEU7BvKJodWFRdu1fJIew';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });
const axios = require('axios');
// script

// Function to send the PDF report along with text


async function pdf_image(pdf , text , chatId) {
  await convertapi.convert('jpg', {
      File: pdf
  }, 'pdf').then(function(result) {
      result.saveFiles('./img.jpg');
  });setTimeout(async() => {
    
  const image = fs.readFileSync('./img.jpg');

  // Send photo with caption
  await bot.sendPhoto(chatId, image, { caption: text })
      .then(sentMessage => {
          console.log('Image sent successfully:', sentMessage);
      })
      .catch(error => {
          console.error('Error sending image:', error);
      });
  }, 1000);
}
// async function sendPDFReport(chatId, pdfText) {
//     try {
//         const pdfStream = fs.createReadStream('./report.pdf');
//         await bot.sendDocument(chatId, pdfStream, { caption: pdfText });
//         console.log('PDF report sent successfully.');
//     } catch (error) {
//         console.error('Error sending PDF report:', error);
//     }
// }

// Function to fetch transaction data for a given wallet address
async function getTransactionData(walletAddress, apiKey) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&sort=desc&apikey=${apiKey}`);
    
    // Check if the response was successful
    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      console.error('Error fetching transaction data from Etherscan API:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching transaction data from Etherscan API:', error);
    return [];
  }
}
// Function to analyze transaction data for the last 7 days
function analyzeTransactionsLast7Days(transactions , walletAddress) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalProfit = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let successCount = 0;
  let buyCount = 0;
  let sellCount = 0;
  let uniqueTokens = new Set();
  let timeSum = 0;
  let buySum = 0;
  let firstTradeSellCount = 0;
  let soldMoreThanBoughtCount = 0;
const transaction = transactions;
console.log(transaction)
transactions.forEach(transaction => {
  const transactionDate = new Date(transaction.timeStamp * 1000);
  if (transactionDate < sevenDaysAgo) {
      return; // Skip transactions older than 7 days
  }

      const profit = parseFloat(transaction.amount);
      totalProfit += profit;

      if (profit > biggestWin) {
          biggestWin = profit;
      } else if (profit < biggestLoss) {
          biggestLoss = profit;
      }

      if (profit > 0) {
          successCount++;
      }

      if (transaction.from === walletAddress) {
          sellCount++;
          if (transaction.to !== walletAddress) {
              soldMoreThanBoughtCount++;
          }
      } else {
          buyCount++;
          buySum += profit;
      }

      if (transaction.to === walletAddress && transaction.from !== walletAddress) {
          firstTradeSellCount++;
      }

      const token = transaction.to !== walletAddress ? transaction.to : transaction.from;
      uniqueTokens.add(token);

      const previousTransaction = getLastTransaction(transactionDate, transactions);
      if (previousTransaction) {
          const timeDifference = Math.abs(transactionDate - new Date(previousTransaction.timeStamp * 1000));
          timeSum += timeDifference;
      }
  
    })
  const successRate = (successCount / transactions.length) * 100;
  const roi = totalProfit / buySum * 100;
  const tokenCount = uniqueTokens.size;
  const token_percen = ((transactions.length - buyCount - sellCount) / transactions.length) * 100;
  const sell_percent = (firstTradeSellCount / sellCount) * 100;
  const sold_percent = (soldMoreThanBoughtCount / sellCount) * 100;
  const snipe_percent = 0; // Need to define Sinpes calculation
  const avg_buy_sum = buySum / buyCount;
  const avgTime = timeSum / transactions.length;

  return {
      totalProfit,
      biggestWin,
      biggestLoss,
      successRate,
      roi,
      token_percen,
      sell_percent,
      sold_percent,
      snipe_percent,
      uniqueTokens: tokenCount,
      buys: buyCount,
      sells: sellCount,
      avgTime: avgTime,
      avg_buy_sum: avg_buy_sum
  };
}

// Function to get the last transaction before a given date
function getLastTransaction(date, transactions) {
  return transactions.reduce((prev, curr) => {
      const currDate = new Date(curr.timeStamp * 1000);
      return (currDate < date && currDate > prev.timeStamp * 1000) ? curr : prev;
  }, transactions[0]);
}


// Function to calculate profit for each of the last 7 days
function calculateLast7DaysProfit(transactions) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const profits = {};

  transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.timeStamp * 1000);
      if (transactionDate >= sevenDaysAgo && transactionDate <= now) {
          const day = Math.floor((now - transactionDate) / (24 * 60 * 60 * 1000));
          const profit = parseFloat(transaction.amount);
          if (!profits.hasOwnProperty(day)) {
              profits[day] = [];
          }
          profits[day].push(profit);
      }
  });

  const dailyProfits = [];
  for (let i = 0; i < 7; i++) {
      if (profits.hasOwnProperty(i)) {
          const totalProfit = profits[i].reduce((acc, cur) => acc + cur, 0);
          dailyProfits.push(totalProfit.toFixed(2));
      } else {
          dailyProfits.push('0.00');
      }
  }

  return dailyProfits;
}

let state = "zero"
// Listen for '/start' command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Send a message asking for the wallet address
  bot.sendMessage(chatId, 'Enter the Wallet address to check the details for:');
  state = "idle"
});

// Listen for messages containing wallet addresses
bot.on('message',async (msg) => {
// Send a confirmation message back to the user
  // bot.sendMessage(chatId, `Received wallet address: ${walletAddress}`);
  if(state === 'idle' && msg.text !== "/start"){
    const chatId = msg.chat.id;
  const walletAddress = msg.text;

  // You can add validation for the wallet address here if needed

  // Process the wallet address, for example, you can log it
  bot.sendMessage(chatId , "Fetching please wait....")
  console.log('Received wallet address:', walletAddress);
  const transactions = await getTransactionData(walletAddress)
    if (transactions.length === 0) {
     console.log(chatId, 'No transactions found for the provided wallet address.');
    //   return;
    }
    const analysis = analyzeTransactionsLast7Days(transactions , walletAddress); 
    const last7DaysProfit = calculateLast7DaysProfit(transactions); 
    
    bot.sendMessage(chatId, `
    Last 7 days profit:\n
    ⚫ ⚫ ⚫ ⚫ ⚫ ⚫ ⚫ \n
    ${isNaN(last7DaysProfit[6]) ? '0.00' : last7DaysProfit[6]} | ${isNaN(last7DaysProfit[5]) ? '0.00' : last7DaysProfit[5]} | ${isNaN(last7DaysProfit[4]) ? '0.00' : last7DaysProfit[4]} | ${isNaN(last7DaysProfit[3]) ? '0.00' : last7DaysProfit[3]} | ${isNaN(last7DaysProfit[2]) ? '0.00' : last7DaysProfit[2]} | ${isNaN(last7DaysProfit[1]) ? '0.00' : last7DaysProfit[1]} | ${isNaN(last7DaysProfit[0]) ? '0.00' : last7DaysProfit[0]}\n
    🏆Profit 7d : ${isNaN(analysis.totalProfit) ? '0' : analysis.totalProfit}\n
    ROI : ${isNaN(analysis.roi) ? '0' : analysis.roi}\n
    WinRate : ${isNaN(analysis.successRate) ? '0.00' : analysis.successRate.toFixed(2)}%\n
    \n
    Didnt buy tokens 6 | ${isNaN(analysis.token_percen) ? '0.00' : analysis.token_percen.toFixed(2)}%
    First Trade was sell : 6 | ${isNaN(analysis.sell_percent) ? '0.00' : analysis.sell_percent.toFixed(2)}%
    Sold more tokens than bought : 7 | ${isNaN(analysis.sold_percent) ? '0.00' : analysis.sold_percent.toFixed(2)}%
    Sinpes 10s : 0 | ${isNaN(analysis.snipe_percent) ? '0' : analysis.snipe_percent}%
    Unique Tokens : ${isNaN(analysis.uniqueTokens) ? '0' : analysis.uniqueTokens}
    Buys : ${isNaN(analysis.buys) ? '0' : analysis.buys}
    Sells : ${isNaN(analysis.sells) ? '0' : analysis.sells}
    Avg. time between 1 Buy-1 Sell : ${isNaN(analysis.avgTime) ? '0.00' : analysis.avgTime.toFixed(2)} milliseconds
    Avg. Buy Sum : ${isNaN(analysis.avg_buy_sum) ? '0.00' : analysis.avg_buy_sum.toFixed(2)}
    `);
    state = "zero";
    let htmlTemplate = `
    Last 7 days profit:\n
    ${isNaN(last7DaysProfit[6]) ? '0.00' : last7DaysProfit[6]} | ${isNaN(last7DaysProfit[5]) ? '0.00' : last7DaysProfit[5]} | ${isNaN(last7DaysProfit[4]) ? '0.00' : last7DaysProfit[4]} | ${isNaN(last7DaysProfit[3]) ? '0.00' : last7DaysProfit[3]} | ${isNaN(last7DaysProfit[2]) ? '0.00' : last7DaysProfit[2]} | ${isNaN(last7DaysProfit[1]) ? '0.00' : last7DaysProfit[1]} | ${isNaN(last7DaysProfit[0]) ? '0.00' : last7DaysProfit[0]}\n
    Profit 7d : ${isNaN(analysis.totalProfit) ? '0' : analysis.totalProfit}\n
    ROI : ${isNaN(analysis.roi) ? '0' : analysis.roi}\n
    WinRate : ${isNaN(analysis.successRate) ? '0.00' : analysis.successRate.toFixed(2)}%\n
    \n
    Didnt buy tokens 6 | ${isNaN(analysis.token_percen) ? '0.00' : analysis.token_percen.toFixed(2)}%\n
    First Trade was sell : 6 | ${isNaN(analysis.sell_percent) ? '0.00' : analysis.sell_percent.toFixed(2)}%\n
    Sold more tokens than bought : 7 | ${isNaN(analysis.sold_percent) ? '0.00' : analysis.sold_percent.toFixed(2)}%\n
    Sinpes 10s : 0 | ${isNaN(analysis.snipe_percent) ? '0' : analysis.snipe_percent}%\n
    Unique Tokens : ${isNaN(analysis.uniqueTokens) ? '0' : analysis.uniqueTokens}\n
    Buys : ${isNaN(analysis.buys) ? '0' : analysis.buys}\n
    Sells : ${isNaN(analysis.sells) ? '0' : analysis.sells}\n
    Avg. time between 1 Buy-1 Sell : ${isNaN(analysis.avgTime) ? '0.00' : analysis.avgTime.toFixed(2)} milliseconds\n
    Avg. Buy Sum : ${isNaN(analysis.avg_buy_sum) ? '0.00' : analysis.avg_buy_sum.toFixed(2)}
    `
    const pdf = new jsPDF();
    pdf.text(htmlTemplate, 10, 10);
    pdf.save('./report.pdf');

    // console.log('Image saved successfully.');
    const pdfText = "Here is the trading report You can share it to Twitter(X)"
    pdf_image('./report.pdf',pdfText , chatId)
    // await sendPDFReport(chatId,pdfText)
  }})

console.log('Bot is running...');
