import React from 'react';
import { View, Text, Image, AsyncStorage, Platform } from 'react-native';
import styles from './styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { URL } from '@constants/urls';
import { setWallet } from '@reducers/wallet';
import { setSession } from '@reducers/session';
import { getFormatNumber } from '@services/get-format-number';
import { getSessionStatus } from '@services/get-session-status';
import { getData } from '@services/get-data';
import NavigationService from '@services/route';
import { Button } from 'native-base';

class WalletDetail extends React.Component{

	static defaultProps = {
		image: require('@assets/images/wallet-background.png')
	}

    componentWillMount(){
        this.getWallet();
    }

	getWallet(){
		AsyncStorage.getItem("session").then((value) => {
			getData(URL.GET_WALLET, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					"session_id": value,
					"f.po_qc_id": this.props.type.id
				})	
			}).then((body) => {
				if(body.status == 200){
					if(body.code == 1){
						this.props.setWallet({
							id: body.po_wallet_id,
							total:  getFormatNumber(
                                (body.items.length == 0) ? 
                                    0 : body.items[0].po_qc_id == 150 ? body.items[0].po_total_sum / 100 : body.items[0].po_total_sum / 10000, 
                                this.props.type.id
                            ),
							current: getFormatNumber(
                                (body.items.length == 0) ? 
                                    0 : body.items[0].po_qc_id == 150 ? body.items[0].po_curr_sum / 100 : body.items[0].po_curr_sum / 10000, 
                                this.props.type.id
                            )
						});
					} else if(body.code == -1 || body.code == -2 || body.code == -3){
						if(this.props.session == false){
							this.props.setSession(true);
							getSessionStatus();
						}
					}
				} else {
					void 0;
				}
			}).catch((error) => {
				void 0;
			});
		});
	}


    render(){
        return (
            <View style={[
                Platform.OS == 'android' ? styles.container : null,
                Platform.OS == 'ios' ? this.props.type.id != 150 ? styles.step : styles.unit : null
            ]}>
                {
                    Platform.OS == 'android' ? 
                        <View style={{ alignItems: 'center' }}>
                            <View style={styles.block}>
                                <Image style={styles.image} source={this.props.image}/>
                            </View>
                            <View style={{ justifyContent: 'center', flex: 1, alignItems: 'center'}}>
                                <Text style={styles.title}>{this.props.type.title} in your wallet</Text>
                                <Text style={styles.current} adjustsFontSizeToFit={true} numberOfLines={1}>{this.props.wallet.current}</Text>
                                {
                                    this.props.type.id == 150 ?
                                        <Button style={styles.button} onPress={() => NavigationService.navigate("Refill", { route: "Wallet", title: 'FA.Unit', type: 'Refill' })}>
                                            <Text style={styles.button_text}>Refill</Text>
                                        </Button> : <Text style={styles.total} adjustsFontSizeToFit={true} numberOfLines={1}>Extracted in total: {this.props.wallet.total}</Text>
                                }
                            </View>
                        </View> : 
                        <View>
                            <View> 
                                <Text style={[styles.title, this.props.type.id == 150 ? { textAlign: 'center' } : { textAlign: 'left' }]}>{this.props.type.title} in your wallet:</Text>
                                {
                                    this.props.type.id != 150 ?
                                        <Text style={String(this.props.wallet.current).length < 6 ? styles.current : styles.current_small} numberOfLines={1} >
                                            {this.props.wallet.current}
                                        </Text> :
                                        <Text style={[String(this.props.wallet.current).length < 14 ? styles.current : styles.current_small, { textAlign: 'center' } ]} numberOfLines={1}>
                                            {this.props.wallet.current}
                                        </Text>
                                }
                            </View>
                            {
                                this.props.type.id != 150 ?
                                    <View>
                                        <Text style={styles.total}>{this.props.type.title} was extracted: </Text>
                                        <Text style={styles.total_small}>{this.props.wallet.total}</Text>
                                    </View> : null
                            }
                        </View>
                }

            </View>
        )
    }

}

const mapStateToProps = (state) => ({ 
    type: state.type,
    wallet: state.wallet,
	session: state.session
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
    setWallet,
	setSession
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(WalletDetail);