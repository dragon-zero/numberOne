var date = new Date();
var year = date.getFullYear();
var mounth = date.getMonth() + 1;
var day = date.getDate();

// $("#datetime-picker-checkin").calendar({
//     value: [year+'-'+mounth+'-'+day]
// });

// $("#datetime-picker-checkout").calendar({
//     value: [year+'-'+mounth+'-'+(day+1)]
// });

$.init();
/**---------------------------提交订单-----------------------------**/
var pay_id;
var order_sn;
var bed_ids = [];
var AllRooms = [];
var startIndex = 0;
var endIndex = 5;
$("#submitbtn").click(function() {
	//获取时间
	var check_in_time = $("#datetime-picker-checkin").val();
	var check_out_time = $("#datetime-picker-checkout").val();
	if(bed_ids == "") {
		//查询房间
		$.ajax({
			type: 'POST',
			url: 'http://pay.usian.cn/Api/Room/check.html',
			data: {
				token: localStorage.token,
				check_in_time: check_in_time,
				check_out_time: check_out_time
			},
			success: function(data) {
				console.log(data)
				if(data.error == 500) {
					$.alert("请重新登录");
					if($.alert("请重新登录")){
						$.router.load("#login-page")
					}
				} else if(data.error == 0) {
					
					
					$("#time-tip").html('')
					$("#time-tip")[0].style.display = 'none';
					if(data.info.rooms) {
						AllRooms = data.info.rooms;
						var rooms = AllRooms.slice(startIndex,endIndex);
						startIndex=0;
						endIndex=5;
						var rooms = template('room_item',{rooms:rooms});
						$("#rooms_list").html(rooms)
						$("#showmore")[0].style.display = 'block';
					}
					$(".checkbox").click(function() {
						var checkboox = document.getElementsByName('checkboox');
						bed_ids=[];
						for(var i = 0; i < checkboox.length; i++) {
							if(checkboox[i].checked) {
								bed_ids.push(checkboox[i].id)
							}
						}
						if(bed_ids==""){
							$("#submitbtn").text("查询可用房间")
						}else{
							$("#submitbtn").text("确定下单")
						}

					})

				} else {
					$("#time-tip")[0].style.display = 'block';
					$("#time-tip").html(data.message)
				}
			},
			error: function(xhr, type) {
				console.error('Ajax error!')
			}
		})
	} else {
		//创建订单
		$.ajax({
			type: 'POST',
			url: 'http://pay.usian.cn/Api/Order/create.html',
			data: {
				token: localStorage.token,
				check_in_time: check_in_time,
				check_out_time: check_out_time,
				beds: bed_ids
			},
			success: function(data) {
				console.log(data)
				localStorage.order = JSON.stringify(data);
				if(data.error == '500') {
					$.router.load('#login-page')
				} else if(data.error == '0') {
					var html = template('create-order-list-temp', data.info)
					$("#create-order-list").html(html)
					$("#deposit").html("￥"+(data.info.deposit/100).toFixed(2));
					$("#total").html("￥"+(data.info.total/100).toFixed(2));
					$("#order_sn").html(data.info.order_sn);

					pay_id = data.info.pay_id;
					order_sn = data.info.order_sn;

					$.router.load("#order_page");
					payTimeCount();
				}else{
					$.alert(data.message)
				}
			},
			error: function(xhr, type) {
				console.error('Ajax error!')
			}
		})
	}

})
/**------------------------------登陆页----------------------------- **/
$("#loginbtn").click(function() {
	var username = $("#username").val();
	var password = $("#password").val();
	if(username != '' && password != '') {
		$.ajax({
			type: 'POST',
			url: 'http://pay.usian.cn/api/user/login.html',
			data: {
				username: username,
				password: password
			},
			success: function(data) {
				console.log(data)
				if(data.message === 'ok') {
					localStorage.setItem('token', data.info.token)
					$.router.load("#main-page");
				}else{
					$.alert(data.message)
				}
			},
			error: function(xhr, type) {
				console.error('Ajax error!')
			}
		})
	}else{
		$.alert("用户名或密码为空")
	}
})
/**------------------------------查看用户所有订单----------------------------- **/
$("#to_person_order").click(function() {
	$.ajax({
		type: 'POST',
		url: 'http://pay.usian.cn/Api/OrderQuery/query.html',
		data: {
			token: localStorage.token
		},
		success: function(data) {
			console.log(data)
			if(data.error == 500) {
				$.router.load("#login-page")
			} else if(data.error == 0) {
				console.log(1111)
				var rooms = template('person-order-list-temp', data);
				$("#person-order-list").html(rooms)
			}
		},
		error: function(xhr, type) {
			console.error('Ajax error!')
		}
	})
	$.popup('#person_order_page')
})




$("#showmore").click(function(){
	if(endIndex<AllRooms.length){
		startIndex += 5;
		endIndex += 5;
		var rooms = AllRooms.slice(startIndex,endIndex);
		var html = template('room_item',{rooms:rooms});
		$("#rooms_list").append(html);
	}else{
		$.alert("没有更多了")
	}

})



/**------------------------------支付----------------------------- **/
var startTime = 120;
var canPay = true;
var countTime;
$("#paybtn").click(function() {
	if(canPay) {
		getOrderPay()
	}
})
//获取订单支付地址
function getOrderPay() {
	$.ajax({
		type: 'POST',
		url: 'http://pay.usian.cn/Api/OrderPay/create.html',
		data: {
			token: localStorage.token,
			pay_id: 1,
			order_sn: order_sn,
			callback:'http://pay.usian.cn/paysuccess.html'
		},
		success: function(data) {
			console.log(data)
			if(data.error == 0) {
				var payurl = data.info.pay_url;
				window.location.href = payurl;
			}
		},
		error: function(xhr, type) {
			console.error('Ajax error!')
		}
	})
}

function payTimeCount() {
	countTime = setInterval(function() {
		startTime--;
		var min = Math.floor(startTime / 60);
		min = min <= 0 ? '' : (min + '分')
		var sec = startTime % 60 + '秒';
		var t = min + sec;
		$(".remain-time").html(t)
		if(startTime <= 0) {
			canPay = false;
			clearInterval(countTime)
		}
	}, 1000)
}

//退房
function tuifang(order_sn){
	$.ajax({
		type: 'POST',
		url: 'http://pay.usian.cn/Api/OrderRefund/refund.html',
		data: {
			token:localStorage.token,
			order_sn:order_sn
		},
		success: function(data) {
			console.log(data)
			$.alert("退款中....")
		},
		error: function(xhr, type) {
			console.error('Ajax error!')
		}
	})
}
