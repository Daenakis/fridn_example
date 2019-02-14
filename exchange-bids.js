import React from 'react';
import { View, AsyncStorage, Alert, ActivityIndicator } from 'react-native';
import { URL } from '@constants/urls';
import styles from './styles';
import Detail from '@containers/exchange-detail/exchange-detail';
import Title from '@containers/exchange-title/exchange-title';
import List from '@containers/exchange-data/exchange-data';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getSessionStatus } from '@services/get-session-status';
import { setSession } from '@reducers/session';
import { setLoader } from '@reducers/loader';
import { setExchange } from '@reducers/exchange';
import { uniqBy, sortBy } from 'lodash';
import { getData } from '@services/get-data';

class ExchangeBids extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            page: 1,
            detail: [],
            exchange: [],
            loader: false,
        }
    }

    componentWillMount(){
        this.props.setExchange({
            detail: [],
            list: []
        })
        this.getExchange();
    }

    getExchange(){
        this.props.setLoader(true);
        AsyncStorage.getItem('session').then((value) => {
            getData(URL.EXCHANGE_BIDS, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "session_id": value,
                    "page": 1,
                    "type": this.props.type
                })
            }).then((body) => {
                this.props.setLoader(false);
                if(body.status == 200){
                    if(body.code == 1){
                        this.props.setExchange({
                            detail: {
                                rate: body.rate,
                                rate_per_day: body.rate_per_day,
                                total_offers: body.total_offers,
                                total_offers_qc: body.total_offers_qc
                            },
                            list: sortBy(uniqBy(this.props.exchange.list.concat(body.items), 'id'), 'date').reverse()
                        })
                    } else if(body.code == -2 || body.code == -3){
                        if(this.props.session == false){
                            this.props.setSession(true);
                            getSessionStatus();
                        }
                    } else {
                        Alert.alert('Fridn', body.message);
                    }
                } else {
                    Alert.alert('Fridn','Something went wrong, error: '+ body.status);
                }
            }).catch((error) => {
                this.props.setLoader(false);
                Alert.alert('Fridn', error.message);
            });
        });
    }

    render(){
        return (
            <View style={styles.container}>
            	<ActivityIndicator animating={this.props.loader} color="white" size="large" style={!this.props.loader ? styles.loader_disabled : styles.loader_enabled} />
                <Detail type={this.props.type} background={true}/>
                <Title type={this.props.type}/>
                <List type={this.props.type}/>
            </View>
        )
    }

}

const mapStateToProps = (state) => ({
    session: state.session,
    loader: state.loader,
    exchange: state.exchange
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
    setSession,
    setLoader,
    setExchange
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeBids); 