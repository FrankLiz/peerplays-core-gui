/*
 * Copyright (c) 2015 Cryptonomex, Inc., and contributors.
 *
 * The MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


import {
    DASHBOARD_CHANGE_SIDE,
    DASHBOARD_SET_BALANCES,
    DASHBOARD_UPDATE,
    DASHBOARD_TOGGLE_SHOW_HIDDEN_ASSETS,
    DASHBOARD_SET_RECENT_ACTIVITY,
    DASHBOARD_SET_OPEN_ORDERS,
    DASHBOARD_SET_SIDE_VESTING_BALANCES,
    DASHBOARD_SET_SIDE_MEMBER
    } from "../constants/ActionTypes";

import DashboardBalancesService from '../services/DashboardBalancesService';
import Repository from '../repositories/chain/repository';

/**
 * Private Redux Action Creator (DASHBOARD_TOGGLE_SHOW_HIDDEN_ASSETS)
 * @param showHiddenAssets boolean
 * @returns {{type: (DASHBOARD_TOGGLE_SHOW_HIDDEN_ASSETS), payload: {showHiddenAssets: boolean}}}
 */
function toggleShowHiddenAssetsAction(showHiddenAssets) {
    return {
        type: DASHBOARD_TOGGLE_SHOW_HIDDEN_ASSETS,
        payload: {
            showHiddenAssets: showHiddenAssets
        }
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_CHANGE_SIDE)
 * Dashboard Side: Set available balances
 * @param sideData
 * @returns {{type: (DASHBOARD_CHANGE_SIDE), payload: Object}}
 */
function setSideAction(sideData) {
    return {
        type: DASHBOARD_CHANGE_SIDE,
        payload: sideData
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_SET_BALANCES)
 * @param data
 * @returns {{type: (DASHBOARD_SET_BALANCES), payload: Object}}
 */
function setBalancesAction(data) {
    return {
        type: DASHBOARD_SET_BALANCES,
        payload: data
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_UPDATE)
 * @param data
 * @returns {{type: (DASHBOARD_UPDATE), payload: Object}}
 */
function updateAssetAction(data) {
    return {
        type: DASHBOARD_UPDATE,
        payload: data
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_SET_RECENT_ACTIVITY)
 * @param data
 * @returns {{type, payload: *}}
 */
function setRecentActivityAction(data) {
    return {
        type: DASHBOARD_SET_RECENT_ACTIVITY,
        payload: data
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_SET_OPEN_ORDERS)
 * @param data
 * @returns {{type, payload: *}}
 */
function setOpenOrdersAction(data) {
    return {
        type: DASHBOARD_SET_OPEN_ORDERS,
        payload: data
    }
}

/**
 * Private Redux Action Creator (DASHBOARD_SET_SIDE_VESTING_BALANCES)
 * Side Vesting
 * @param data
 * @returns {{type, payload: *}}
 */
function setVestingBalancesAction(data) {
    return {
        type: DASHBOARD_SET_SIDE_VESTING_BALANCES,
        payload: data
    }
}
/**
 * Private Redux Action Creator (DASHBOARD_SET_SIDE_MEMBER)
 *
 * @param data
 * @returns {{type, payload: *}}
 */
function setMemberDataAction(data) {
    return {
        type: DASHBOARD_SET_SIDE_MEMBER,
        payload: data
    }
}

class DashboardPageActions {

    //TODO::
    static fetchCurrentBalance() {
        return (dispatch, getState) => {

            let currentState = getState();

            DashboardBalancesService.fetchCurrentBalance(currentState.app.account, currentState.settings.unit, currentState.settings.defaults.unit).then(() => {
                dispatch(DashboardPageActions.updateSideData());
            })


        }
    }

    /**
     * Dashboard Update
     * @returns {Function}
     */
    static updateData() {
        return (dispatch, getState) => {

            let currentState = getState();

            dispatch(DashboardPageActions.updateSideData());

            let data = DashboardBalancesService.calculate(currentState.settings.unit, currentState.settings.hiddenAssets);

            dispatch(DashboardPageActions.setBalances({
                coreSymbol: data.coreSymbol,
                assetSymbol: data.assetSymbol,
                decimals: data.decimals,
                precision: data.precision,

                coreToken: data.coreToken,
                fiat: data.fiat,
                cryptoTokens: data.cryptoTokens,
                smartCoins: data.smartCoins,
                otherAssets: data.otherAssets
            }));

            let activityData = DashboardBalancesService.getRecentActivityAndOpenOrdersData();
            dispatch(DashboardPageActions.setRecentActivity({
                recentActivity: activityData.recentActivity,
                headBlockNumber: activityData.headBlockNumber,
                blockInterval: activityData.blockInterval
            }));
            dispatch(DashboardPageActions.setOpenOrders({
                openOrders: activityData.openOrders
            }));

        };
    }


    /**
     * Update Dashboard Side
     *
     * @returns {function(*, *)}
     */
    static updateSideData() {
        return (dispatch, getState) => {

            let currentState = getState();


            /**
             * Total
             */
            let availableBalances = DashboardBalancesService.calculateAvailableBalances(currentState.settings.defaults.unit);

            dispatch(DashboardPageActions.setSide({
                availableBalances: availableBalances
            }));

            /**
             * Member
             */
            Repository.getAccount(currentState.app.account).then((account) => {

                dispatch(setMemberDataAction({
                    memberAccount: account
                }));

            });

            /**Vesting
             *
             */
            let vestingBalances = currentState.dashboardPage.vestingBalances,
                vestingAsset = currentState.dashboardPage.vestingAsset,
                vestingBalancesIds = currentState.dashboardPage.vestingBalancesIds;

            DashboardBalancesService.calculateVesting(currentState.app.account, vestingBalances).then((data) => {

                if (!data) {
                    return null;
                }

                if ((vestingBalancesIds !== data.vestingBalancesIds) || (vestingBalances !== data.vestingBalances) || (vestingAsset !== data.vestingAsset)) {
                    dispatch(setVestingBalancesAction({
                        vestingBalancesIds: data.vestingBalancesIds,
                        vestingBalances: data.vestingBalances,
                        vestingAsset: data.vestingAsset
                    }));
                }
            });

        };
    }

    /**
     * Dashboard Side: Set available balances
     * @param side Object
     * @returns {Function}
     */
    static setSide(side) {
        return (dispatch) => {
            dispatch(setSideAction(side));
        };
    }

    /**
     * Dashboard Side: set vesting balances
     *
     * @param data
     * @returns {function(*)}
     */
    static setVestingBalances(data) {
        return (dispatch) => {
            dispatch(setVestingBalancesAction(data));
        };
    }


    /**
     * Set dashboard balances
     *
     * @param {Object} data
     * @returns {Function}
     */
    static setBalances(data) {

        return (dispatch) => {

            dispatch(setBalancesAction({
                coreToken: data.coreToken,
                fiat: data.fiat,
                cryptoTokens: data.cryptoTokens,
                smartCoins: data.smartCoins,
                otherAssets: data.otherAssets,
                history: data.history,

                coreSymbol: data.coreSymbol,
                assetSymbol: data.assetSymbol,
                decimals: data.decimals,
                precision: data.precision
            }));

        }
    }


    /**
     * Dashboard row: toggle hidden asset
     * @param id
     * @param type
     * @param hidden
     * @returns {Function}
     */
    static toggleAssetHidden(id, type, hidden) {

        return (dispatch, getState) => {

            let state = getState(),
                list = state.dashboardPage[type];

            if (list) {

                let listNext = list.update(
                    list.findIndex((item) => {
                        return item.get("id") === id;
                    }), (item) => {
                        return item.set("hidden", hidden);
                    }
                );

                let updateData = {};
                updateData[type] = listNext;

                dispatch(updateAssetAction(updateData))
            }


        }
    }

    /**
     * Dashboard row: toggle hidden asset
     * @returns {Function}
     */
    static toggleShowHiddenAssets() {
        return (dispatch, getState) => {
            let state = getState();
            dispatch(toggleShowHiddenAssetsAction(!state.dashboardPage.showHiddenAssets));

        }
    }

    /**
     * Dashboard Recent Activity Block
     *
     * @param data
     * @returns {function(*)}
     */
    static setRecentActivity(data) {
        return dispatch => {
            dispatch(setRecentActivityAction(data));
        }
    }

    /**
     * Dashboard: set Open Orders
     *
     * @param data
     * @returns {function(*)}
     */
    static setOpenOrders(data) {
        return dispatch => {
            dispatch(setOpenOrdersAction(data));
        }
    }

}


export default DashboardPageActions;