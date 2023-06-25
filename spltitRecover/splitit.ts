import { Address, ipfs, json } from "@graphprotocol/graph-ts";
import{
NewContribution as NewContributionEvent,
  NewExpenseCreated as NewExpenseCreatedEvent,
  PayBackContributor as PayBackContributorEvent,
  PayVendor as PayVendorEvent
} from "../generated/Splitit/Splitit";
import {NewExpense, Account, Contribution,PaymentToContributor,PaymentsToVendor}from "../generated/schema";
import { integer } from "@protofire/subgraph-toolkit";


export function handleNewExpenseCreated(event: NewExpenseCreatedEvent): void {

 let entity = NewExpense.load(event.params.expenseId.toHex());
 if (entity==null){
  entity = new NewExpense(event.params.expenseId.toHex());
  entity.expenseId = event.params.expenseId;
  entity.expenseOwner = event.params.expenseOwner;
  entity.expenseVendor = event.params.expenseVendor;
  entity.deadline = event.params.deadline
  entity.initialDeposit = event.params.initialDeposit;
  entity.eventDataCID = event.params.eventDataCID;
  entity.maxCapacity = event.params.maxCapacity;
  entity.actualCost = event.params.actualCost;
  entity.paidOut=false;
  entity.totalContributors=integer.ZERO;
  //entity.contributions
  //entity.paidOutContributor
 }
  entity.save()
}

function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address.toHex());
  if (account == null) {
    account = new Account(address.toHex());
    account.totalAmountDeposited = integer.ZERO;
    account.totalContributions = integer.ZERO;
    account.save();
  }
  return account;
}

export function handleNewContribution(event: NewContributionEvent): void {
  let id = event.params.expenseId.toHex() + event.params.contributorAddress.toHex(); //primary key
  let entity= Contribution.load(id);
  let account = getOrCreateAccount(event.params.contributorAddress);
  let thisExpense = NewExpense.load(event.params.expenseId.toHex());
  if (entity == null && thisExpense != null)
  {
    entity = new Contribution(id);
    entity.contributorAddress=account.id;
    entity.amountDeposited = event.params.amountDeposited;
    entity.expense = thisExpense.id;
    entity.save();
    thisExpense.totalContributors = integer.increment(thisExpense.totalContributors);
    thisExpense.save();
    account.totalContributions = integer.increment(account.totalContributions);
    account.save();

  }
}
export function handlePayBackContributor(event: PayBackContributorEvent): void {
  let id = event.params.expenseId.toHex() + event.params.attendeeAddress.toHex(); //primary key
  let entity= PaymentToContributor.load(id);
  let account = getOrCreateAccount(event.params.attendeeAddress);
  let thisExpense = NewExpense.load(event.params.expenseId.toHex());
  if (entity == null && thisExpense != null){
  entity = new PaymentToContributor(id);
  entity.expense = thisExpense.id;
  entity.contributorAddress = account.id;
  entity.amountPaidOutIndividually = event.params.amountPaidOutIndividually;
  entity.amountPaidback = event.params.amountPaidback; // difference of deposit and amount paid individually
  entity.save();
}

}

export function handlePayVendor(event: PayVendorEvent): void {
  let id = event.params.expenseId.toHex()+event.params.amountPaidOutIndividually.toHex();
  let entity= PaymentsToVendor.load(id);
  let thisExpense = NewExpense.load(event.params.expenseId.toHex());
  if (entity == null && thisExpense != null){
    entity = new PaymentsToVendor(id);
    entity.expense = thisExpense.id;
    entity.amountPaidOutIndividually = event.params.amountPaidOutIndividually;
    entity.save();
    thisExpense.paidOut=true;
    thisExpense.save();
  }

  
}


