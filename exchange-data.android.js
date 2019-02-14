import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing, Dimensions, AsyncStorage, Alert } from 'react-native';
import styles from './styles';
import { URL } from '@constants/urls';
import Plus from 'react-native-vector-icons/Feather';
import { getSessionStatus } from '@services/get-session-status';
import { getFormatNumber } from '@services/get-format-number';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { setExchange } from '@reducers/exchange';
import { setLoader } from '@reducers/loader';
import { filter, uniqBy, sortBy } from 'lodash';
import { getData } from '@services/get-data';
import NavigationService from '@services/route';
import { Button } from 'native-base'
 
class ExchangeData extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            contentHeight: 0,
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            animation_value: new Animated.Value(0),
            page: 1,
        }
    }

    componentWillMount(){
        this.getAnimation();
    }

    getAnimation(){
        this.setState({ animation_value: new Animated.Value(0) });
        Animated.timing(
            this.state.animation_value, { 
                toValue: 1, 
                duration: 700, 
                easing: Easing.linear 
        }).start();
        this.setState({
            item: this.state.animation_value.interpolate({
                inputRange: [0, 1],
                outputRange: [0, this.state.width * 0.24]
            })
        })
    }

    getTime(value){
        let date = new Date(value);
        let hours = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();
        return (hours < 10 ? `0${hours}` : hours)+':'+(minutes < 10 ? `0${minutes}` : minutes)+':'+(seconds < 10 ? `0${seconds}` : seconds);
    }

    getDate(value){
        let date = new Date(value);
        let day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear();
        return (day < 10 ? `0${day}` : day)+'.'+(month < 10 ? `0${month}` : month)+'.'+(`${String(year).substr(2, String(year).length)}`);
    }

    goEdit(id, rate, qc){
        NavigationService.navigate('Sell', {
            route: "Exchange",
            title: this.props.type,
            sell: { 
                title: this.props.type == 1 ? "FA.Step" : "FA.Unit",
                exchange: id,
                rate: rate,
                qc: qc,
                id: this.props.type == 1 ? 140 : 150
            }
        })
    }

    goBuyChecked(id){
        Alert.alert(
            'Fridn', 
            `Do you want buy this ${this.props.type == 1 ? "bid" : "ask"}?`, [
                { text: 'Cancel', onPress: () => { cancelable: false }},
                { text: 'OK', onPress: () => this.goBuy(id)}
            ],
            { cancelable: false }
        )
    }

    goBuy(id){
        this.props.setLoader(true);
        AsyncStorage.getItem('session').then((value) => {
            getData(URL.EXCHANGE_BUY, {
                method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
                    "session_id": value,
                    "id": id
                })
            }).then((body) => {
                this.props.setLoader(false);
                if(body.status == 200){
                    if(body.code == 1){
                        let temp = this.props.exchange.list;
                        this.props.setExchange({
                            detail: this.props.exchange.detail,
                            list: filter(temp, item => { return item.id != id})
                        })
                    } else {
                        Alert.alert('Fridn', body.message);
                    }
                } else {
                    Alert.alert('Fridn','Something went wrong, error: '+ body.status);
                }
            }).catch((error) => {
                this.props.setLoader(false);
				Alert.alert('Fridn', error.message);
            })
        });
    }

    endScroll = (event) => {
		if(
			event.nativeEvent.contentOffset.y > event.nativeEvent.contentSize.height - 
			event.nativeEvent.layoutMeasurement.height - 10
		) {
            this.props.setLoader(true);
            this.setState({ page: this.state.page + 1});
            AsyncStorage.getItem('session').then((value) => {
                getData(URL.EXCHANGE_BIDS, {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "session_id": value,
                        "page": this.state.page,
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
	}

    render(){
        return (
            <View style={styles.container}>
                <ScrollView 
                    overScrollMode={'always'}    
                    showsVerticalScrollIndicator={false}
                    onScroll={this.endScroll} 
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        this.setState({ contentHeight: contentHeight })			  
                    }}
                >
                    <View style={styles.scroll}>
                        {
                            this.props.exchange.list.map((item, i) => {
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.item} 
                                        activeOpacity={1}
                                        onPress={() => (this.getAnimation(), this.setState({ current: this.state.current == item.id ? null : item.id }))}
                                    >
                                        <Animated.View style={[styles.block, this.state.current == item.id ? { right: this.state.item } : { right: 1 }]}>
                                            <View style={{width: this.state.width, flexDirection: 'row'}}>
                                                {item.own ? <View style={styles.own}/> : null}
                                                <View style={styles.row}>
                                                    <Text numberOfLines={1} style={styles.text}>{this.getDate(item.date)}</Text>
                                                    <Text numberOfLines={1} style={styles.text}>{this.getTime(item.date)}</Text>
                                                </View>
                                                <View style={styles.row}>
                                                    <Text numberOfLines={1} style={styles.text}>{getFormatNumber(item.proposed.value, item.proposed.type)}</Text>
                                                </View>
                                                <View style={styles.row}>
                                                    <Text numberOfLines={1} style={styles.text}>{getFormatNumber(item.desired.value, item.desired.type)}</Text>
                                                </View>
                                                <View style={[styles.row, styles.rate]}>
                                                    <Text numberOfLines={1} style={[styles.text, getFormatNumber(item.rate).length > 8 ? {fontSize: this.state.width * 0.03} : null]}> {getFormatNumber(item.rate)}</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.row_button, this.state.current == item.id ? {right: 1} : {right: -this.state.width * 0.24}]}>
                                                <Button
                                                    style={styles.button}
                                                    onPress={() => item.own ? this.goEdit(item.id, item.rate, item.proposed.value) : this.goBuyChecked(item.id)}
                                                >
                                                    <Text style={styles.button_text}>{item.own ? "EDIT" : "BUY"}</Text>
                                                </Button>
                                            </View>
                                        </Animated.View>
                                        <View style={styles.line}/>
                                    </TouchableOpacity>
                                )
                            })
                        }
                    </View>
                </ScrollView>
                <View style={styles.button_container}>
                    <View style={styles.plus_container}>
                        <Button 
                            style={styles.plus}
                            onPress={() => NavigationService.navigate("Sell", { route: "Exchange", title: this.props.type, sell: { title: this.props.type == 1 ? "FA.Step" : "FA.Unit", id: this.props.type == 1 ? 140 : 150 } })}
                        >
                            <Plus name="plus" style={styles.plus_text}/>
                        </Button>
                    </View>
                </View>
            </View> 
        )
    }
}

const mapStateToProps = (state) => ({
    exchange: state.exchange,
    loader: state.loader
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
    setExchange,
    setLoader,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeData);