from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),
    path('hostels', views.hostel, name='hostels'),
    path('show_detail_hostel/<int:item_id>/', views.show_det_hostel, name='show_detail_hostel'),
    path('client', views.client, name='client'),
    path('logout', views.logout_view, name='logout'),
    path('request-login', views.request_login, name='request_login'),
    path('booking/<int:item_id>/', views.booking, name='booking'),
    path('account', views.account, name='account'),
    path('detail-booking/<int:item_id>/', views.detail_booking, name='detail_booking'),
    path('create-admin', views.add_admin, name='create_admin'),
    path('new-hotel', views.create_hotels, name='new_hotel'),
    path('new-room/<int:item_id>/', views.create_room, name='create_room'),
    path('del-comment/<int:item_id>/', views.del_comment, name='del_comment'),
    path('promo', views.promo, name='promo_ac')
]