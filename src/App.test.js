import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

function replaceAmount(previousAmount,nextAmount) {
  for(let i=0;i<String(previousAmount).length;i+=1) {
    fireEvent.click(screen.getByRole("button",{name:"⌫"}));
  }
  for(const digit of String(nextAmount)) {
    fireEvent.click(screen.getByRole("button",{name:digit}));
  }
}

test("a saved transaction can be edited repeatedly without creating duplicates",()=>{
  localStorage.clear();
  const date=new Date();
  date.setHours(12,0,0,0);
  localStorage.setItem("kk_txs",JSON.stringify([{
    id:"tx-1",type:"expense",date:date.toISOString(),amount:1000,category:"식비",asset:"카드",memo:"점심"
  }]));

  render(<App />);

  const openTransaction=()=>{
    fireEvent.click(screen.getByText(String(date.getDate()),{selector:"div"}));
    fireEvent.click(screen.getByRole("button",{name:"수정"}));
  };

  openTransaction();
  replaceAmount(1000,2000);
  fireEvent.click(screen.getByRole("button",{name:"수정 완료"}));

  openTransaction();
  replaceAmount(2000,3000);
  fireEvent.click(screen.getByRole("button",{name:"수정 완료"}));

  fireEvent.click(screen.getByText(String(date.getDate()),{selector:"div"}));
  expect(screen.getByText("-3,000원")).toBeInTheDocument();
  expect(screen.getAllByRole("button",{name:"수정"})).toHaveLength(1);
});
