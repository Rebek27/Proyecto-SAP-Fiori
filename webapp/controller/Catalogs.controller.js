sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "jquery",
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast, $) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.Catalogs",
      {
        // ---------------------------------------------------- INICIO DE LA VISTA

        onInit: function () {
          var oModel = new JSONModel();
          var that = this;

          this._oDialog = null;

          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
              that.getView().setModel(oModel);
            },
          });
        },

        // ---------------------------------------------------- PARA FILTRAR EN LA TABLA

        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getSource().getValue();
          var oTable = this.byId("catalogTable");
          var aItems = oTable.getItems();

          if (!sQuery) {
            aItems.forEach(function (oItem) {
              oItem.setVisible(true);
            });
            return;
          }

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            var oData = oContext.getObject();
            var bVisible = Object.keys(oData).some(function (sKey) {
              var value = oData[sKey];

              if (typeof value === "string") {
                return value.toLowerCase().includes(sQuery.toLowerCase());
              } else if (typeof value === "number") {
                return value.toString().includes(sQuery);
              }

              return false;
            });

            oItem.setVisible(bVisible);
          });
        },

        // ---------------------------------------------------- PARA AGREGAR UN NUEVO LABEL

        onAddCatalog: function () {
          // Inicializa el modelo con estructura completa
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "seguridad", // Valor por defecto
            SEQUENCE: 10, // Valor por defecto
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
              ],
            },
          });

          this.getView().setModel(oModel, "addCatalogModel");

          // Cargar el diálogo si no existe
          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.fragments.AddCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: function () {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          // Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Validación básica
          if (!oData.LABELID || !oData.LABEL) {
            MessageToast.show("LABELID y LABEL son campos requeridos");
            return;
          }

          // Preparar datos para enviar
          var payload = {
            values: oData,
          };

          console.log("Data:", JSON.stringify(oData));

          $.ajax({
            url: "http://localhost:4004/api/sec/newLabel", // Ajusta tu endpoint
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (response) {
              MessageToast.show("Catálogo agregado correctamente");
              this._oAddDialog.close();

              // Agregar el nuevo registro
              aData.push(oData);
              // Actualizar el modelo
              oTableModel.setProperty("/value", aData);

              // this._refreshCatalogTable();
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al guardar: " + error.responseText);
            },
          });
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        // ---------------------------------------------------- FIN PARA AGREGAR UN NUEVO LABEL

        // ---------------------------------------------------- PARA EDITAR UN LABEL

        onEditPressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          // Crear modelo para edición
          var oEditModel = new JSONModel($.extend(true, {}, oData));
          this.getView().setModel(oEditModel, "editModel");

          // Cargar diálogo de edición
          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.fragments.EditCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          // Obtener el modelo de la tabla
          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Llamada a la API para actualizar
          $.ajax({
            url: "http://localhost:4004/api/sec/updateLabel",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              values: oEditedData,
            }),
            success: function (response) {
              MessageToast.show("Registro actualizado correctamente");
              this._oEditDialog.close();

              // Agregar el nuevo registro
              aData.push(oEditedData);
              // Actualizar el modelo
              oTableModel.setProperty("/value", aData);
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error al actualizar: " + error.responseText);
            }.bind(this),
          });
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        // ---------------------------------------------------- FIN PARA EDITAR UN LABEL

        onCloseDialog: function () {
          if (this._oDialog) {
            this._oDialog.close();
          }
        },

        _refreshCatalogTable: function () {
          // Implementa la lógica para refrescar los datos de la tabla
          var oTable = this.byId("catalogTable");
          var oModel = this.getView().getModel();

          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
            },
          });
        },

        // ----- PARA EDITAR UN LABEL

        onItemPress: function (oEvent) {
          var oItem = oEvent.getParameter("listItem");
          var oContext = oItem.getBindingContext();
          var oSelectedData = oContext.getObject(); // Obtiene los datos del ítem seleccionado

          var sLabelID = oSelectedData.LABELID;
          var sUrl =
            "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" +
            encodeURIComponent(sLabelID);
          var that = this;

          $.ajax({
            url: sUrl,
            method: "GET",
            dataType: "json",
            success: function (response) {
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    // Pasa los valores y también el ítem seleccionado
                    oController.loadValues(response.value || []);

                    // Actualiza el selectedValue en el modelo values
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            },
            error: function () {
              MessageToast.show("Error al cargar valores");
            },
          });

          // Expandir el panel derecho
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%"); // O el porcentaje/píxeles que prefieras
          }

          // Opcional: reducir el panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },

        // EXPERIMENTAL

        onSelectionChange: function (oEvent) {
          // Obtener el item seleccionado
          var oTable = this.byId("catalogTable");
          var oSelectedItem = oTable.getSelectedItem();

          if (!oSelectedItem) {
            this._disableAllActions();
            return;
          }

          // Habilitar todos los botones de acción
          this.byId("editButton").setEnabled(true);
          this.byId("deleteButton").setEnabled(true);

          // Determinar estado para activar/desactivar
          var oContext = oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          console.log(oData);

          // Actualizar visibilidad de botones según estado
          this.byId("activateButton").setVisible(!oData.DETAIL_ROW.ACTIVED);
          this.byId("deactivateButton").setVisible(oData.DETAIL_ROW.ACTIVED);

          // Guardar referencia al item seleccionado
          this._oSelectedItem = oSelectedItem;

          // Mostrar información en panel derecho (opcional)
          this._loadDetailInformation(oSelectedItem);
        },

        _disableAllActions: function () {
          this.byId("editButton").setEnabled(false);
          this.byId("activateButton").setEnabled(false);
          this.byId("deactivateButton").setEnabled(false);
          this.byId("deleteButton").setEnabled(false);
        },

        _loadDetailInformation: function (oSelectedItem) {
          var oContext = oSelectedItem.getBindingContext();
          var oSelectedData = oContext.getObject();
          var sLabelID = oSelectedData.LABELID;
          var that = this;

          $.ajax({
            url:
              "http://localhost:4004/api/sec/valuesCRUD?procedure=get&labelID=" +
              encodeURIComponent(sLabelID),
            method: "GET",
            dataType: "json",
            success: function (response) {
              var oValuesView = that.byId("XMLViewValues");
              if (oValuesView) {
                oValuesView.loaded().then(function () {
                  var oController = oValuesView.getController();
                  if (oController && oController.loadValues) {
                    oController.loadValues(response.value || []);
                    oValuesView
                      .getModel("values")
                      .setProperty("/selectedValue", oSelectedData);
                  }
                });
              }
            },
            error: function () {
              MessageToast.show("Error al cargar valores");
            },
          });

          // Expandir el panel derecho
          this._toggleDetailPanel(true);
        },

        _toggleDetailPanel: function (bShow) {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();

          if (oLayoutData) {
            oLayoutData.setSize(bShow ? "100%" : "0px");
          }

          // Ajustar panel izquierdo
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize(bShow ? "0%" : "100%");
          }
        },

        // Implementación de acciones

        onActivatePressed: function () {
          this._changeStatus(true);
        },

        onDeactivatePressed: function () {
          this._changeStatus(false);
        },

        _changeStatus: function (bActivate) {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();
          var sAction = bActivate ? "activateLabel" : "deactivateLabel";

          $.ajax({
            url: "http://localhost:4004/api/sec/" + sAction,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ labelID: oData.LABELID }),
            success: function () {
              MessageToast.show(
                "Registro " + (bActivate ? "activado" : "desactivado")
              );
              this._refreshCatalogTable();
            }.bind(this),
            error: function (error) {
              MessageToast.show("Error: " + error.responseText);
            },
          });
        },

        onDeletePressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          MessageBox.confirm("¿Está seguro de eliminar este registro?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                $.ajax({
                  url: "http://localhost:4004/api/sec/deleteLabel",
                  method: "POST",
                  contentType: "application/json",
                  data: JSON.stringify({ labelID: oData.LABELID }),
                  success: function () {
                    MessageToast.show("Registro eliminado");
                    this._refreshCatalogTable();
                    this._toggleDetailPanel(false);
                  }.bind(this),
                  error: function (error) {
                    MessageToast.show(
                      "Error al eliminar: " + error.responseText
                    );
                  },
                });
              }
            }.bind(this),
          });
        },

        /* _refreshCatalogTable: function () {
          var oModel = this.getView().getModel();

          $.ajax({
            url: "http://localhost:4004/api/sec/getall",
            method: "GET",
            success: function (data) {
              oModel.setData({ value: data.value });
              this._disableAllActions();
            }.bind(this),
            error: function () {
              MessageToast.show("Error al actualizar datos");
            },
          });
        }, */
      }
    );
  }
);
