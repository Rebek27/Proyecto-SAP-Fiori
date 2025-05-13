sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/CheckBox",
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.Invertions", {

    onInit: function () {
      this.getOwnerComponent().getRouter().getRoute("RouteInvertions")
        .attachPatternMatched(this._onRouteMatched, this);

      const oData = {
        items: [
          { date: "2025-05-12", open: 211.06, high: 211.26, low: 206.75, close: 210.79, volume: 63677685 },
          { date: "2025-05-09", open: 199.00, high: 200.53, low: 197.53, close: 198.53, volume: 36453923 },
          { date: "2025-05-08", open: 200.45, high: 200.45, low: 194.67, close: 198.00, volume: 50478823 }
        ],
        chartData: [
          { date: "2025-05-01", close: 210.79 },
          { date: "2025-05-02", close: 213.32 },
          { date: "2025-05-03", close: 208.90 },
          { date: "2025-05-04", close: 215.00 }
        ]
      };

      const oModel = new JSONModel(oData);
      this.getView().setModel(oModel);

      // Definición de indicadores por estrategia
      this._indicatorDefaults = {
        ma: [
          {
            name: "EMA",
            show: true
          },
          {
            name: "RSI",
            show: true
          }
        ],
        macd: [
          {
            name: "MACD",
            show: false
          }
        ]
      };
    },

    _onRouteMatched: function (oEvent) {
      const sSymbol = oEvent.getParameter("arguments").symbol;
      const oInput = this.byId("symbolInput");
      oInput.setValue(sSymbol);
      oInput.setEnabled(false);
    },

    onStrategyChange: function (oEvent) {
      const sKey = oEvent.getSource().getSelectedKey();
      const aIndicators = this._indicatorDefaults[sKey] || [];
      const oVBox = this.byId("indicatorParamsVBox");

      if (!oVBox) return;

      oVBox.removeAllItems();

      aIndicators.forEach(indicator => {
        const oCheckRow = new sap.m.HBox();

        oCheckRow.addItem(new sap.m.Label({ text: indicator.name }));
        oCheckRow.addItem(new sap.m.CheckBox({
          selected: indicator.show,
          text: "Mostrar en gráfica",
          select: function (oEvt) {
            indicator.show = oEvt.getParameter("selected");
          }
        }));


        oVBox.addItem(oCheckRow);
        oVBox.addItem(new sap.m.ToolbarSeparator());
      });

      // Guarda los indicadores activos para graficar más tarde
      this._activeIndicators = aIndicators;
    },


    onSimulate: function () {
      const aMostrar = (this._activeIndicators || []).filter(ind => ind.show);
      console.log("Indicadores seleccionados para graficar:", aMostrar);

      // Datos de resultados simulados
      const oResultados = {
        estrategia: this.byId("strategyCombo").getSelectedItem().getText(),
        porcentajeRetorno: "12.4", // ← Puedes calcular esto
        ingresos: "$4,278.88"      // ← También puedes calcularlo
      };

      // Asignar al modelo
      const oModel = this.getView().getModel();
      oModel.setProperty("/resultados", oResultados);

      sap.m.MessageToast.show("Simulación completada");
    },

    onNavBack: function () {
      const oHistory = sap.ui.core.routing.History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteCompanies", {}, true);
      }
    }
  });
});