import React from 'react';
import styles from './styles';
import common from '@constants/styles';
import Back from '@containers/back/back';
import { View, Text, Keyboard, StatusBar, ActivityIndicator, AsyncStorage } from 'react-native';
import { VALIDATION } from '@constants/validation';
import { TextField } from 'react-native-material-textfield';
import { Dropdown } from 'react-native-material-dropdown';
import { URL } from '@constants/urls';
import { Button } from 'native-base';
import Texture from '@containers/texture/texture';
import NavigationService from '@services/route';
import { getSessionStatus } from '@services/get-session-status';
import { setSession } from '@reducers/session';
import { getData } from '@services/get-data';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

class Refill extends React.Component{

	static navigationOptions = ({navigation}) => ({
		title: `${navigation.state.params.type} FA.Unit`,
		headerStyle: common.header,
		headerTitleStyle: common.header_title,
		headerLeft: <Back handler={() => NavigationService.navigate(navigation.state.params.route, { title: navigation.state.params.title })}/>,	
	});

    state = {
        loader: false,
        type: '',
        errorType: '',
        qc: '',
		errorQC: '',
		list: [
			{ value: 'Bank transfer', id: 1 },
			{ value: 'Distributor', id: 2 },
			{ value: 'Card account', id: 3 },
			{ value: 'Bitcoin account', id: 4 }
		]
    }

    constructor(props){
		super(props);
    }
    
    componentWillMount(){
		Keyboard.dismiss();
		AsyncStorage.getItem('session').then((value) => {
			(value) ? NavigationService.goBackPress('Main') : NavigationService.goBackPress('Start');
			return false;
		});
    }

    validationQC(){
		this.setState({ qc: this.state.qc.trim() });
		this.state.errorQC = (!this.state.qc.trim() || !VALIDATION.UNIT.test(this.state.qc.trim())) ? `FA is incorrect` : "";
		this.setState({ errorQC: this.state.errorQC });
		return this.state.errorQC == '' ? true : false;
	}

	validationType(){
		this.state.errorType = !this.state.type ? 'Payment method is incorrect' : '';
		this.setState({ errorType: this.state.errorType });
		return this.state.errorType == '' ? true : false;
	}
	
	getID(){
		return this.state.list.filter((item, i) => {
			return item.value == this.state.type;
		})
	}

    send(){
		let item = this.getID();
		Keyboard.dismiss();
        this.setState({ loader: true });
        this.validationQC();
        this.validationType();
        if(this.validationQC() && this.validationType()){
			AsyncStorage.getItem("session").then((value) => {
				getData(this.props.navigation.state.params.type == "Refill" ? URL.REPLENISHMENT_UNIT : URL.DRAWAL_UNIT, {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						"session_id": value,
						"value": +this.state.qc.replace(/[,.]/g, '.'),
						"type": item[0].id
					})
				}).then((body) => {
					this.setState({ loader: false });
					if(body.status == 200){
						if(body.code == 1){
							NavigationService.navigate("RefillFinished", { bank: item[0].id })
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
					this.setState({ loader: false });
					Alert.alert('Fridn', error.message);
				});
			});
        } else {
			this.setState({ loader: false });
		}
    }

    render(){
        return(
            <View style={styles.container}>
            	<StatusBar backgroundColor="#000" barStyle="light-content"/>
                <ActivityIndicator animating={this.state.loader} color="white" size="large" style={!this.state.loader ? common.loader_disabled : common.loader_enabled} />
                <Dropdown
					onFocus = { () => this.setState({errorType: ''}) }
					label='Payment method'
					baseColor='#68717D'
					tintColor='#B9966C'
					itemColor="#000"
					pickerStyle={styles.dropdown_container}
					style={styles.field_text}
					itemTextStyle={{color: '#000'}}
					error={this.state.errorType}
					errorColor='#E35050'
					dropdownPosition={0}
					value={this.state.type}
					onChangeText={(type) => this.setState({ type })}
					inputContainerStyle={{borderBottomWidth: 1}}
       				data={this.state.list}
      			/>
                <TextField
					keyboardType='numeric'
					onFocus = { () => this.setState({errorQC: ''})}
					baseColor='#68717D'
					tintColor='#B9966C'
					inputContainerStyle={{borderBottomWidth: 1}}
					textColor = '#FFFFFF'
					style={styles.field_text}
					errorColor='#E35050'
					error={this.state.errorQC}
					label={'How many?'}
					value={this.state.qc}
					onChangeText={ (qc) =>  this.setState({ qc }) }
				/>
                <Text style={styles.rate}>1 FA.Unit = 1 USD</Text>
				<Button style={styles.button} onPress={() => this.send()}>
					<Text style={styles.button_text}>SEND</Text>
				</Button>
                <Texture/>
            </View>
        )
    }

}

const mapStateToProps = (state) => ({
	session: state.session,
	profile: state.profile
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
	setSession
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Refill);