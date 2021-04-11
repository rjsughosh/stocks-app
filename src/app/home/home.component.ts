import { Component, OnInit } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { ThemeService } from "ng2-charts";
import { HttpClient } from "@angular/common/http";
import { ChartOptions, ChartType, ChartDataSets } from "chart.js";
import * as pluginDataLabels from "chartjs-plugin-datalabels";
import { ToastrService } from "ngx-toastr";
import { Label } from "ng2-charts";
import { cloneDeep } from "lodash";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  public barChartPlugins = [pluginDataLabels];
  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,

    scales: {
      xAxes: [
        {
          ticks: {
            fontColor: "#fff",
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            fontColor: "#fff",
          },
        },
      ],
    },
    plugins: {
      datalabels: {
        anchor: "center",
        align: "center",
        color: "#fff",
        clamp: true,
      },
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          const datasetLabel =
            data.datasets[tooltipItem.datasetIndex].label || "";
          return datasetLabel + ": " + tooltipItem.yLabel + " USD";
        },
      },
    },
  };

  objectKeys = Object.keys;

  public tickerSearchText = "";
  public searchResults = [];

  public tickerSymbols = [];
  public tickerSymbolsObj = {};
  public barChartLabels = [];
  public barChartType = "bar";
  public barChartLegend = false;
  public barChartData = [
    {
      data: [],
      labels: [],
    },
  ];

  tickerSymbol = "";
  disableInput: boolean = false;
  timeoutKiller;
  chartObj = {};
  graphArr = [];
  darkTheme: boolean = true;
  isValid: boolean = false;

  testUrl_pre = "https://cloud.iexapis.com/stable/stock/market/batch?symbols=";
  testUrl_post = "&types=quote&token=pk_044db279039d465eb16ff69f5b0ead45";

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private themeService: ThemeService
  ) {}

  changeLabelColours() {
    let overrides: ChartOptions;
    if (this.darkTheme) {
      overrides = {
        legend: {
          labels: { fontColor: "white" },
        },
        scales: {
          xAxes: [
            {
              ticks: { fontColor: "white" },
              gridLines: { color: "rgba(255,255,255,0.1)" },
            },
          ],
          yAxes: [
            {
              ticks: { fontColor: "white" },
              gridLines: { color: "rgba(255,255,255,0.1)" },
            },
          ],
        },
        plugins: {
          datalabels: {
            anchor: "center",
            align: "center",
            color: "#fff",
          },
        },
      };
    } else {
      overrides = {
        legend: {
          labels: { fontColor: "#000" },
        },
        scales: {
          xAxes: [
            {
              ticks: { fontColor: "#000" },
              gridLines: { color: "rgba(0,0,0,0.1)" },
            },
          ],
          yAxes: [
            {
              ticks: { fontColor: "#000" },
              gridLines: { color: "rgba(0,0,0,0.1)" },
            },
          ],
        },
        plugins: {
          datalabels: {
            anchor: "center",
            align: "center",
            color: "#000",
          },
        },
      };
    }
    this.themeService.setColorschemesOptions(overrides);
  }
  validate(params?) {
    let param = "";
    if (!params) {
      param = this.tickerSymbol;
    } else {
      param = params;
    }
    if (param) {
      let stockName = param;
      let baseUrl = "https://cloud.iexapis.com/stable/stock/";
      let apiToken = "pk_044db279039d465eb16ff69f5b0ead45";
      let finalUrl = `${baseUrl}${stockName}/quote?token=${apiToken}`;
      this.http.get<any>(finalUrl).subscribe(
        (data) => {
          this.isValid = true;
          this.addToList(stockName);
        },
        (error) => {
          this.toasterPop(
            `Failed to get data for ${stockName}: ${error.error}`
          );
          this.tickerSymbol = "";
          this.isValid = false;
        }
      );
    }
  }
  getData() {
    let str = "";
    for (let ticker of this.tickerSymbols) {
      str += "" + ticker + ",";
    }
    let final_url = this.testUrl_pre + str + this.testUrl_post;
    this.http.get<any>(final_url).subscribe(
      (data) => {
        this.chartObj = data;
        this.loadDataIntoGraph();
      },
      (error) => {
        this.toasterPop(`Failed to get data: ${error.error}`);
      }
    );

    this.timeoutKiller = setTimeout(() => {
      this.getData();
    }, 5000);
  }

  addToList(newStock) {
    if (this.isValid) {
      if (this.tickerSymbols.length <= 9) {
        if (!this.tickerSymbols.includes(newStock.toLowerCase())) {
          this.tickerSymbols.push(newStock.toLowerCase());
          clearTimeout(this.timeoutKiller);
          this.getData();
        } else {
          this.toasterPop(`${newStock} already exists`);
        }
      } else {
        this.disableInput = true;
        this.toasterPop(`Max limit: 10 reached`);
      }
      this.tickerSymbol = "";
    }
  }

  deleteStock(symbol) {
    let index = this.graphArr.indexOf(symbol);
    this.graphArr.splice(index, 1);
    index = this.tickerSymbols.indexOf(symbol.tickerSymbol.toLowerCase());
    this.tickerSymbols.splice(index, 1);

    clearTimeout(this.timeoutKiller);

    if (this.tickerSymbols.length) {
      this.getData();
    } else {
      this.clearAll();
    }
  }

  loadDataIntoGraph() {
    this.graphArr = [];
    let tickers = Object.keys(this.chartObj);
    for (let i = 0; i < tickers.length; i++) {
      let obj = {
        tickerSymbol: tickers[i],
        stockValue: this.chartObj[tickers[i]].quote.latestPrice,
        companyName: this.chartObj[tickers[i]].quote.companyName,
      };
      this.graphArr.push(obj);
    }

    const barchartLabels = this.graphArr.map((i) => i.tickerSymbol);
    this.barChartLabels = cloneDeep(barchartLabels);
    const stockvalues = this.graphArr.map((i) => i.stockValue);
    this.barChartData[0].data = cloneDeep(stockvalues);
  }

  clearAll() {
    this.barChartData[0].data = [];
    this.barChartLabels = [];
    this.tickerSymbols = [];
    this.graphArr = [];
    this.chartObj = {};
    this.tickerSearchText = "";
    this.searchResults = [];
    clearTimeout(this.timeoutKiller);
  }

  searchTicker() {
    if (!this.tickerSearchText) {
      this.searchResults = [];
      return;
    }
    const Url = `https://financialmodelingprep.com/api/v3/search?query=${this.tickerSearchText}&limit=5&apikey=demo`;

    this.http.get<any>(Url).subscribe(
      (data) => {
        console.log("search result", data);
        const temp = data.filter((x) => x.currency === "USD");
        this.searchResults = temp;
      },
      (error) => {
        this.toasterPop(
          `Failed to get data for "${this.tickerSearchText}" : ${error.error}`
        );
      }
    );
  }

  toasterPop(message) {
    this.toastr.error(message, "Error", {
      timeOut: 3000,
    });
  }

  ngOnInit() {}
}
